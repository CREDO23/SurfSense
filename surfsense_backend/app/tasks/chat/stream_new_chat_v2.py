"""
Streaming task for the new SurfSense deep agent chat.

This module streams responses from the deep agent using the Vercel AI SDK
Data Stream Protocol (SSE format).

Supports loading LLM configurations from:
- YAML files (negative IDs for global configs)
- NewLLMConfig database table (positive IDs for user-created configs with prompt settings)
"""

from collections.abc import AsyncGenerator
from dataclasses import dataclass
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db import ChatVisibility
from app.prompts import TITLE_GENERATION_PROMPT_TEMPLATE
from app.services.chat.streaming.agent_builder import build_agent
from app.services.chat.streaming.context_builder import build_agent_context
from app.services.chat.streaming.event_extractors import (
    extract_content_from_chat_stream_event,
    extract_tool_info_from_start_event,
    extract_tool_output_from_end_event,
)
from app.services.chat.streaming.llm_config_loader import load_llm_config
from app.services.chat.streaming.stream_state import StreamState
from app.services.chat.streaming.tool_event_handler import (
    yield_thinking_step_end,
    yield_thinking_step_start,
    yield_tool_output_events,
)
from app.services.chat_session_state_service import (
    clear_ai_responding,
    set_ai_responding,
)
from app.services.new_streaming_service import VercelStreamingService


def extract_todos_from_deepagents(command_output) -> dict:
    """
    Extract todos from deepagents' TodoListMiddleware Command output.

    deepagents returns a Command object with:
    - Command.update['todos'] = [{'content': '...', 'status': '...'}]

    Returns the todos directly (no transformation needed - UI matches deepagents format).
    """
    todos_data = []
    if hasattr(command_output, "update"):
        update = command_output.update
        todos_data = update.get("todos", [])
    elif isinstance(command_output, dict):
        if "todos" in command_output:
            todos_data = command_output.get("todos", [])
        elif "update" in command_output and isinstance(command_output["update"], dict):
            todos_data = command_output["update"].get("todos", [])

    return {"todos": todos_data}


@dataclass
class StreamResult:
    accumulated_text: str = ""
    is_interrupted: bool = False
    interrupt_value: dict[str, Any] | None = None


async def _stream_agent_events(
    agent: Any,
    config: dict[str, Any],
    input_data: Any,
    streaming_service: VercelStreamingService,
    result: StreamResult,
    step_prefix: str = "thinking",
    initial_step_id: str | None = None,
    initial_step_title: str = "",
    initial_step_items: list[str] | None = None,
) -> AsyncGenerator[str, None]:
    """Shared async generator that streams and formats astream_events from the agent.

    Yields SSE-formatted strings. After exhausting, inspect the ``result``
    object for accumulated_text and interrupt state.

    Args:
        agent: The compiled LangGraph agent.
        config: LangGraph config dict (must include configurable.thread_id).
        input_data: The input to pass to agent.astream_events (dict or Command).
        streaming_service: VercelStreamingService instance for formatting events.
        result: Mutable StreamResult populated with accumulated_text / interrupt info.
        step_prefix: Prefix for thinking step IDs (e.g. "thinking" or "thinking-resume").
        initial_step_id: If set, the helper inherits an already-active thinking step.
        initial_step_title: Title of the inherited thinking step.
        initial_step_items: Items of the inherited thinking step.

    Yields:
        SSE-formatted strings for each event.
    """
    state = StreamState(
        step_prefix=step_prefix,
        initial_step_id=initial_step_id,
        initial_step_title=initial_step_title,
        initial_step_items=initial_step_items,
    )

    async for event in agent.astream_events(input_data, config=config, version="v2"):
        event_type = event.get("event", "")

        if event_type == "on_chat_model_stream":
            content = extract_content_from_chat_stream_event(event)
            if content:
                if state.current_text_id is None:
                    completion_event = state.complete_current_step(streaming_service)
                    if completion_event:
                        yield completion_event
                    if state.just_finished_tool:
                        state.clear_step_state_after_tool()
                    state.current_text_id = streaming_service.generate_text_id()
                    yield streaming_service.format_text_start(state.current_text_id)
                yield streaming_service.format_text_delta(
                    state.current_text_id, content
                )
                state.add_text(content)

        elif event_type == "on_tool_start":
            tool_name, run_id, tool_input = extract_tool_info_from_start_event(event)

            if state.current_text_id is not None:
                yield streaming_service.format_text_end(state.current_text_id)
                state.end_text_block()

            if state.state.last_active_step_title != "Synthesizing response":
                completion_event = state.complete_current_step(streaming_service)
                if completion_event:
                    yield completion_event

            state.just_finished_tool = False
            tool_step_id = state.next_thinking_step_id()
            state.register_tool_step(run_id, tool_step_id)
            state.last_active_step_id = tool_step_id

            async for event in yield_thinking_step_start(
                tool_name, tool_input, state, tool_step_id, streaming_service
            ):
                yield event

            tool_call_id = (
                f"call_{run_id[:32]}"
                if run_id
                else streaming_service.generate_tool_call_id()
            )
            yield streaming_service.format_tool_input_start(tool_call_id, tool_name)
            yield streaming_service.format_tool_input_available(
                tool_call_id,
                tool_name,
                tool_input if isinstance(tool_input, dict) else {"input": tool_input},
            )

        elif event_type == "on_tool_end":
            tool_name, run_id, tool_output = extract_tool_output_from_end_event(event)
            tool_call_id = f"call_{run_id[:32]}" if run_id else "call_unknown"
            original_step_id = state.get_tool_step_id(run_id)
            state.mark_step_completed(original_step_id)

            async for event in yield_thinking_step_end(
                tool_name, tool_output, state, original_step_id, streaming_service
            ):
                yield event

            state.mark_tool_finished()

            async for event in yield_tool_output_events(
                tool_name, tool_output, tool_call_id, streaming_service
            ):
                yield event

        elif event_type in ("on_chain_end", "on_agent_end"):
            if state.current_text_id is not None:
                yield streaming_service.format_text_end(state.current_text_id)
                state.end_text_block()

    if state.current_text_id is not None:
        yield streaming_service.format_text_end(state.current_text_id)

    completion_event = state.complete_current_step(streaming_service)
    if completion_event:
        yield completion_event

    result.accumulated_text = state.accumulated_text

    agent_state = await agent.aget_state(config)
    is_interrupted = agent_state.tasks and any(
        task.interrupts for task in agent_state.tasks
    )
    if is_interrupted:
        result.is_interrupted = True
        result.interrupt_value = agent_state.tasks[0].interrupts[0].value
        yield streaming_service.format_interrupt_request(result.interrupt_value)


async def stream_new_chat(
    user_query: str,
    search_space_id: int,
    chat_id: int,
    session: AsyncSession,
    user_id: str | None = None,
    llm_config_id: int = -1,
    mentioned_document_ids: list[int] | None = None,
    mentioned_surfsense_doc_ids: list[int] | None = None,
    checkpoint_id: str | None = None,
    needs_history_bootstrap: bool = False,
    thread_visibility: ChatVisibility | None = None,
    current_user_display_name: str | None = None,
) -> AsyncGenerator[str, None]:
    """
    Stream chat responses from the new SurfSense deep agent.

    This uses the Vercel AI SDK Data Stream Protocol (SSE format) for streaming.
    The chat_id is used as LangGraph's thread_id for memory/checkpointing.

    Args:
        user_query: The user's query
        search_space_id: The search space ID
        chat_id: The chat ID (used as LangGraph thread_id for memory)
        session: The database session
        user_id: The current user's UUID string (for memory tools and session state)
        llm_config_id: The LLM configuration ID (default: -1 for first global config)
        needs_history_bootstrap: If True, load message history from DB (for cloned chats)
        mentioned_document_ids: Optional list of document IDs mentioned with @ in the chat
        mentioned_surfsense_doc_ids: Optional list of SurfSense doc IDs mentioned with @ in the chat
        checkpoint_id: Optional checkpoint ID to rewind/fork from (for edit/reload operations)

    Yields:
        str: SSE formatted response strings
    """
    streaming_service = VercelStreamingService()

    try:
        # Mark AI as responding to this user for live collaboration
        if user_id:
            await set_ai_responding(session, chat_id, UUID(user_id))

        # Load LLM config
        config_result = await load_llm_config(
            llm_config_id=llm_config_id,
            session=session,
            search_space_id=search_space_id,
        )
        if config_result.error:
            yield streaming_service.format_error(config_result.error)
            yield streaming_service.format_done()
            return

        llm = config_result.llm
        agent_config = config_result.agent_config

        # Build agent with all dependencies
        agent = await build_agent(
            llm=llm,
            agent_config=agent_config,
            session=session,
            search_space_id=search_space_id,
            chat_id=chat_id,
            user_id=user_id,
            thread_visibility=thread_visibility,
        )

        # Build agent context
        input_state = await build_agent_context(
            user_query=user_query,
            search_space_id=search_space_id,
            chat_id=chat_id,
            session=session,
            thread_visibility=thread_visibility,
            mentioned_document_ids=mentioned_document_ids,
            mentioned_surfsense_doc_ids=mentioned_surfsense_doc_ids,
            needs_history_bootstrap=needs_history_bootstrap,
            current_user_display_name=current_user_display_name,
        )

        # Configure LangGraph with thread_id for memory
        # If checkpoint_id is provided, fork from that checkpoint (for edit/reload)
        configurable = {"thread_id": str(chat_id)}
        if checkpoint_id:
            configurable["checkpoint_id"] = checkpoint_id

        config = {
            "configurable": configurable,
            "recursion_limit": 80,  # Increase from default 25 to allow more tool iterations
        }

        # Start the message stream
        yield streaming_service.format_message_start()
        yield streaming_service.format_start_step()

        # Initial thinking step - analyzing the request
        if mentioned_document_ids or mentioned_surfsense_doc_ids:
            initial_title = "Analyzing referenced content"
            action_verb = "Analyzing"
        else:
            initial_title = "Understanding your request"
            action_verb = "Processing"

        processing_parts = []
        query_text = user_query[:80] + ("..." if len(user_query) > 80 else "")
        processing_parts.append(query_text)

        if mentioned_document_ids:
            count = len(mentioned_document_ids)
            if count == 1:
                processing_parts.append("[1 document]")
            else:
                processing_parts.append(f"[{count} documents]")

        if mentioned_surfsense_doc_ids:
            count = len(mentioned_surfsense_doc_ids)
            if count == 1:
                processing_parts.append("[1 doc]")
            else:
                processing_parts.append(f"[{count} docs]")

        initial_items = [f"{action_verb}: {' '.join(processing_parts)}"]
        initial_step_id = "thinking-1"

        yield streaming_service.format_thinking_step(
            step_id=initial_step_id,
            title=initial_title,
            status="in_progress",
            items=initial_items,
        )

        stream_result = StreamResult()
        async for sse in _stream_agent_events(
            agent=agent,
            config=config,
            input_data=input_state,
            streaming_service=streaming_service,
            result=stream_result,
            step_prefix="thinking",
            initial_step_id=initial_step_id,
            initial_step_title=initial_title,
            initial_step_items=initial_items,
        ):
            yield sse

        if stream_result.is_interrupted:
            yield streaming_service.format_finish_step()
            yield streaming_service.format_finish()
            yield streaming_service.format_done()
            return

        accumulated_text = stream_result.accumulated_text

        # Generate LLM title for new chats after first response
        # Check if this is the first assistant response by counting existing assistant messages
        from sqlalchemy import func

        from app.db import NewChatMessage, NewChatThread

        assistant_count_result = await session.execute(
            select(func.count(NewChatMessage.id)).filter(
                NewChatMessage.thread_id == chat_id,
                NewChatMessage.role == "assistant",
            )
        )
        assistant_message_count = assistant_count_result.scalar() or 0

        # Only generate title on the first response (no prior assistant messages)
        if assistant_message_count == 0:
            generated_title = None
            try:
                # Generate title using the same LLM
                title_chain = TITLE_GENERATION_PROMPT_TEMPLATE | llm
                # Truncate inputs to avoid context length issues
                truncated_query = user_query[:500]
                truncated_response = accumulated_text[:1000]
                title_result = await title_chain.ainvoke(
                    {
                        "user_query": truncated_query,
                        "assistant_response": truncated_response,
                    }
                )

                # Extract and clean the title
                if title_result and hasattr(title_result, "content"):
                    raw_title = title_result.content.strip()
                    # Validate the title (reasonable length)
                    if raw_title and len(raw_title) <= 100:
                        # Remove any quotes or extra formatting
                        generated_title = raw_title.strip("\"'")
            except Exception:
                generated_title = None

            # Only update if LLM succeeded (keep truncated prompt title as fallback)
            if generated_title:
                # Fetch thread and update title
                thread_result = await session.execute(
                    select(NewChatThread).filter(NewChatThread.id == chat_id)
                )
                thread = thread_result.scalars().first()
                if thread:
                    thread.title = generated_title
                    await session.commit()

                    # Notify frontend of the title update
                    yield streaming_service.format_thread_title_update(
                        chat_id, generated_title
                    )

        # Finish the step and message
        yield streaming_service.format_finish_step()
        yield streaming_service.format_finish()
        yield streaming_service.format_done()

    except Exception as e:
        # Handle any errors
        import traceback

        error_message = f"Error during chat: {e!s}"
        print(f"[stream_new_chat] {error_message}")
        print(f"[stream_new_chat] Exception type: {type(e).__name__}")
        print(f"[stream_new_chat] Traceback:\n{traceback.format_exc()}")

        yield streaming_service.format_error(error_message)
        yield streaming_service.format_finish_step()
        yield streaming_service.format_finish()
        yield streaming_service.format_done()

    finally:
        # Clear AI responding state for live collaboration
        await clear_ai_responding(session, chat_id)


async def stream_resume_chat(
    chat_id: int,
    search_space_id: int,
    decisions: list[dict],
    session: AsyncSession,
    user_id: str | None = None,
    llm_config_id: int = -1,
    thread_visibility: ChatVisibility | None = None,
) -> AsyncGenerator[str, None]:
    streaming_service = VercelStreamingService()

    try:
        if user_id:
            await set_ai_responding(session, chat_id, UUID(user_id))

        # Load LLM config
        config_result = await load_llm_config(
            llm_config_id=llm_config_id,
            session=session,
            search_space_id=search_space_id,
        )
        if config_result.error:
            yield streaming_service.format_error(config_result.error)
            yield streaming_service.format_done()
            return

        llm = config_result.llm
        agent_config = config_result.agent_config

        # Build agent with all dependencies
        agent = await build_agent(
            llm=llm,
            agent_config=agent_config,
            session=session,
            search_space_id=search_space_id,
            chat_id=chat_id,
            user_id=user_id,
            thread_visibility=thread_visibility,
        )

        from langgraph.types import Command

        config = {
            "configurable": {"thread_id": str(chat_id)},
            "recursion_limit": 80,
        }

        yield streaming_service.format_message_start()
        yield streaming_service.format_start_step()

        stream_result = StreamResult()
        async for sse in _stream_agent_events(
            agent=agent,
            config=config,
            input_data=Command(resume={"decisions": decisions}),
            streaming_service=streaming_service,
            result=stream_result,
            step_prefix="thinking-resume",
        ):
            yield sse
        if stream_result.is_interrupted:
            yield streaming_service.format_finish_step()
            yield streaming_service.format_finish()
            yield streaming_service.format_done()
            return

        yield streaming_service.format_finish_step()
        yield streaming_service.format_finish()
        yield streaming_service.format_done()

    except Exception as e:
        import traceback

        error_message = f"Error during resume: {e!s}"
        print(f"[stream_resume_chat] {error_message}")
        print(f"[stream_resume_chat] Traceback:\n{traceback.format_exc()}")
        yield streaming_service.format_error(error_message)
        yield streaming_service.format_finish_step()
        yield streaming_service.format_finish()
        yield streaming_service.format_done()

    finally:
        await clear_ai_responding(session, chat_id)
