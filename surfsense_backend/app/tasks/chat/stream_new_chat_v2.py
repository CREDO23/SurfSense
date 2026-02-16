"""
Streaming task for the new SurfSense deep agent chat.

This module streams responses from the deep agent using the Vercel AI SDK
Data Stream Protocol (SSE format).

Supports loading LLM configurations from:
- YAML files (negative IDs for global configs)
- NewLLMConfig database table (positive IDs for user-created configs with prompt settings)
"""

import json
from collections.abc import AsyncGenerator
from dataclasses import dataclass
from typing import Any
from uuid import UUID

from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.agents.new_chat.chat_deepagent import create_surfsense_deep_agent
from app.agents.new_chat.checkpointer import get_checkpointer
from app.agents.new_chat.llm_config import (
    AgentConfig,
    create_chat_litellm_from_agent_config,
    create_chat_litellm_from_config,
    load_agent_config,
    load_llm_config_from_yaml,
)
from app.db import ChatVisibility, Document, SurfsenseDocsDocument
from app.prompts import TITLE_GENERATION_PROMPT_TEMPLATE
from app.services.chat.streaming.event_extractors import (
    extract_content_from_chat_stream_event,
    extract_tool_info_from_start_event,
    extract_tool_output_from_end_event,
)
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
from app.services.connector_service import ConnectorService
from app.services.new_streaming_service import VercelStreamingService
from app.utils.content_utils import bootstrap_history_from_db


def format_mentioned_documents_as_context(documents: list[Document]) -> str:
    """
    Format mentioned documents as context for the agent.

    Uses the same XML structure as knowledge_base.format_documents_for_context
    to ensure citations work properly with chunk IDs.
    """
    if not documents:
        return ""

    context_parts = ["<mentioned_documents>"]
    context_parts.append(
        "The user has explicitly mentioned the following documents from their knowledge base. "
        "These documents are directly relevant to the query and should be prioritized as primary sources. "
        "Use [citation:CHUNK_ID] format for citations (e.g., [citation:123])."
    )
    context_parts.append("")

    for doc in documents:
        # Build metadata JSON
        metadata = doc.document_metadata or {}
        metadata_json = json.dumps(metadata, ensure_ascii=False)

        # Get URL from metadata
        url = (
            metadata.get("url")
            or metadata.get("source")
            or metadata.get("page_url")
            or ""
        )

        context_parts.append("<document>")
        context_parts.append("<document_metadata>")
        context_parts.append(f"  <document_id>{doc.id}</document_id>")
        context_parts.append(
            f"  <document_type>{doc.document_type.value}</document_type>"
        )
        context_parts.append(f"  <title><![CDATA[{doc.title}]]></title>")
        context_parts.append(f"  <url><![CDATA[{url}]]></url>")
        context_parts.append(
            f"  <metadata_json><![CDATA[{metadata_json}]]></metadata_json>"
        )
        context_parts.append("</document_metadata>")
        context_parts.append("")
        context_parts.append("<document_content>")

        # Use chunks if available (preferred for proper citations)
        if hasattr(doc, "chunks") and doc.chunks:
            for chunk in doc.chunks:
                context_parts.append(
                    f"  <chunk id='{chunk.id}'><![CDATA[{chunk.content}]]></chunk>"
                )
        else:
            # Fallback to document content if chunks not loaded
            # Use document ID as chunk ID prefix for consistency
            context_parts.append(
                f"  <chunk id='{doc.id}'><![CDATA[{doc.content}]]></chunk>"
            )

        context_parts.append("</document_content>")
        context_parts.append("</document>")
        context_parts.append("")

    context_parts.append("</mentioned_documents>")

    return "\n".join(context_parts)


def format_mentioned_surfsense_docs_as_context(
    documents: list[SurfsenseDocsDocument],
) -> str:
    """Format mentioned SurfSense documentation as context for the agent."""
    if not documents:
        return ""

    context_parts = ["<mentioned_surfsense_docs>"]
    context_parts.append(
        "The user has explicitly mentioned the following SurfSense documentation pages. "
        "These are official documentation about how to use SurfSense and should be used to answer questions about the application. "
        "Use [citation:CHUNK_ID] format for citations (e.g., [citation:doc-123])."
    )

    for doc in documents:
        metadata_json = json.dumps({"source": doc.source}, ensure_ascii=False)

        context_parts.append("<document>")
        context_parts.append("<document_metadata>")
        context_parts.append(f"  <document_id>doc-{doc.id}</document_id>")
        context_parts.append("  <document_type>SURFSENSE_DOCS</document_type>")
        context_parts.append(f"  <title><![CDATA[{doc.title}]]></title>")
        context_parts.append(f"  <url><![CDATA[{doc.source}]]></url>")
        context_parts.append(
            f"  <metadata_json><![CDATA[{metadata_json}]]></metadata_json>"
        )
        context_parts.append("</document_metadata>")
        context_parts.append("")
        context_parts.append("<document_content>")

        if hasattr(doc, "chunks") and doc.chunks:
            for chunk in doc.chunks:
                context_parts.append(
                    f"  <chunk id='doc-{chunk.id}'><![CDATA[{chunk.content}]]></chunk>"
                )
        else:
            context_parts.append(
                f"  <chunk id='doc-0'><![CDATA[{doc.content}]]></chunk>"
            )

        context_parts.append("</document_content>")
        context_parts.append("</document>")
        context_parts.append("")

    context_parts.append("</mentioned_surfsense_docs>")

    return "\n".join(context_parts)


def extract_todos_from_deepagents(command_output) -> dict:
    """
    Extract todos from deepagents' TodoListMiddleware Command output.

    deepagents returns a Command object with:
    - Command.update['todos'] = [{'content': '...', 'status': '...'}]

    Returns the todos directly (no transformation needed - UI matches deepagents format).
    """
    todos_data = []
    if hasattr(command_output, "update"):
        # It's a Command object from deepagents
        update = command_output.update
        todos_data = update.get("todos", [])
    elif isinstance(command_output, dict):
        # Already a dict - check if it has todos directly or in update
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
        # Load LLM config - supports both YAML (negative IDs) and database (positive IDs)
        agent_config: AgentConfig | None = None

        if llm_config_id >= 0:
            # Positive ID: Load from NewLLMConfig database table
            agent_config = await load_agent_config(
                session=session,
                config_id=llm_config_id,
                search_space_id=search_space_id,
            )
            if not agent_config:
                yield streaming_service.format_error(
                    f"Failed to load NewLLMConfig with id {llm_config_id}"
                )
                yield streaming_service.format_done()
                return

            # Create ChatLiteLLM from AgentConfig
            llm = create_chat_litellm_from_agent_config(agent_config)
        else:
            # Negative ID: Load from YAML (global configs)
            llm_config = load_llm_config_from_yaml(llm_config_id=llm_config_id)
            if not llm_config:
                yield streaming_service.format_error(
                    f"Failed to load LLM config with id {llm_config_id}"
                )
                yield streaming_service.format_done()
                return

            # Create ChatLiteLLM from YAML config dict
            llm = create_chat_litellm_from_config(llm_config)
            # Create AgentConfig from YAML for consistency (uses defaults for prompt settings)
            agent_config = AgentConfig.from_yaml_config(llm_config)

        if not llm:
            yield streaming_service.format_error("Failed to create LLM instance")
            yield streaming_service.format_done()
            return

        # Create connector service
        connector_service = ConnectorService(session, search_space_id=search_space_id)

        # Get Firecrawl API key from webcrawler connector if configured
        from app.db import SearchSourceConnectorType

        firecrawl_api_key = None
        webcrawler_connector = await connector_service.get_connector_by_type(
            SearchSourceConnectorType.WEBCRAWLER_CONNECTOR, search_space_id
        )
        if webcrawler_connector and webcrawler_connector.config:
            firecrawl_api_key = webcrawler_connector.config.get("FIRECRAWL_API_KEY")

        # Get the PostgreSQL checkpointer for persistent conversation memory
        checkpointer = await get_checkpointer()

        visibility = thread_visibility or ChatVisibility.PRIVATE
        agent = await create_surfsense_deep_agent(
            llm=llm,
            search_space_id=search_space_id,
            db_session=session,
            connector_service=connector_service,
            checkpointer=checkpointer,
            user_id=user_id,
            thread_id=chat_id,
            agent_config=agent_config,
            firecrawl_api_key=firecrawl_api_key,
            thread_visibility=visibility,
        )

        # Build input with message history
        langchain_messages = []

        # Bootstrap history for cloned chats (no LangGraph checkpoint exists yet)
        if needs_history_bootstrap:
            langchain_messages = await bootstrap_history_from_db(
                session, chat_id, thread_visibility=visibility
            )

            # Clear the flag so we don't bootstrap again on next message
            from app.db import NewChatThread

            thread_result = await session.execute(
                select(NewChatThread).filter(NewChatThread.id == chat_id)
            )
            thread = thread_result.scalars().first()
            if thread:
                thread.needs_history_bootstrap = False
                await session.commit()

        # Fetch mentioned documents if any (with chunks for proper citations)
        mentioned_documents: list[Document] = []
        if mentioned_document_ids:
            from sqlalchemy.orm import selectinload as doc_selectinload

            result = await session.execute(
                select(Document)
                .options(doc_selectinload(Document.chunks))
                .filter(
                    Document.id.in_(mentioned_document_ids),
                    Document.search_space_id == search_space_id,
                )
            )
            mentioned_documents = list(result.scalars().all())

        # Fetch mentioned SurfSense docs if any
        mentioned_surfsense_docs: list[SurfsenseDocsDocument] = []
        if mentioned_surfsense_doc_ids:
            from sqlalchemy.orm import selectinload

            result = await session.execute(
                select(SurfsenseDocsDocument)
                .options(selectinload(SurfsenseDocsDocument.chunks))
                .filter(
                    SurfsenseDocsDocument.id.in_(mentioned_surfsense_doc_ids),
                )
            )
            mentioned_surfsense_docs = list(result.scalars().all())

        # Format the user query with context (mentioned documents + SurfSense docs)
        final_query = user_query
        context_parts = []

        if mentioned_documents:
            context_parts.append(
                format_mentioned_documents_as_context(mentioned_documents)
            )

        if mentioned_surfsense_docs:
            context_parts.append(
                format_mentioned_surfsense_docs_as_context(mentioned_surfsense_docs)
            )

        if context_parts:
            context = "\n\n".join(context_parts)
            final_query = f"{context}\n\n<user_query>{user_query}</user_query>"

        if visibility == ChatVisibility.SEARCH_SPACE and current_user_display_name:
            final_query = f"**[{current_user_display_name}]:** {final_query}"

        # if messages:
        #     # Convert frontend messages to LangChain format
        #     for msg in messages:
        #         if msg.role == "user":
        #             langchain_messages.append(HumanMessage(content=msg.content))
        #         elif msg.role == "assistant":
        #             langchain_messages.append(AIMessage(content=msg.content))
        # else:
        # Fallback: just use the current user query with attachment context
        langchain_messages.append(HumanMessage(content=final_query))

        input_state = {
            # Lets not pass this message atm because we are using the checkpointer to manage the conversation history
            # We will use this to simulate group chat functionality in the future
            "messages": langchain_messages,
            "search_space_id": search_space_id,
        }

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
        if mentioned_documents or mentioned_surfsense_docs:
            initial_title = "Analyzing referenced content"
            action_verb = "Analyzing"
        else:
            initial_title = "Understanding your request"
            action_verb = "Processing"

        processing_parts = []
        query_text = user_query[:80] + ("..." if len(user_query) > 80 else "")
        processing_parts.append(query_text)

        if mentioned_documents:
            doc_names = []
            for doc in mentioned_documents:
                title = doc.title
                if len(title) > 30:
                    title = title[:27] + "..."
                doc_names.append(title)
            if len(doc_names) == 1:
                processing_parts.append(f"[{doc_names[0]}]")
            else:
                processing_parts.append(f"[{len(doc_names)} documents]")

        if mentioned_surfsense_docs:
            doc_names = []
            for doc in mentioned_surfsense_docs:
                title = doc.title
                if len(title) > 30:
                    title = title[:27] + "..."
                doc_names.append(title)
            if len(doc_names) == 1:
                processing_parts.append(f"[{doc_names[0]}]")
            else:
                processing_parts.append(f"[{len(doc_names)} docs]")

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

        agent_config: AgentConfig | None = None
        if llm_config_id >= 0:
            agent_config = await load_agent_config(
                session=session,
                config_id=llm_config_id,
                search_space_id=search_space_id,
            )
            if not agent_config:
                yield streaming_service.format_error(
                    f"Failed to load NewLLMConfig with id {llm_config_id}"
                )
                yield streaming_service.format_done()
                return
            llm = create_chat_litellm_from_agent_config(agent_config)
        else:
            llm_config = load_llm_config_from_yaml(llm_config_id=llm_config_id)
            if not llm_config:
                yield streaming_service.format_error(
                    f"Failed to load LLM config with id {llm_config_id}"
                )
                yield streaming_service.format_done()
                return
            llm = create_chat_litellm_from_config(llm_config)
            agent_config = AgentConfig.from_yaml_config(llm_config)

        if not llm:
            yield streaming_service.format_error("Failed to create LLM instance")
            yield streaming_service.format_done()
            return

        connector_service = ConnectorService(session, search_space_id=search_space_id)

        from app.db import SearchSourceConnectorType

        firecrawl_api_key = None
        webcrawler_connector = await connector_service.get_connector_by_type(
            SearchSourceConnectorType.WEBCRAWLER_CONNECTOR, search_space_id
        )
        if webcrawler_connector and webcrawler_connector.config:
            firecrawl_api_key = webcrawler_connector.config.get("FIRECRAWL_API_KEY")

        checkpointer = await get_checkpointer()
        visibility = thread_visibility or ChatVisibility.PRIVATE

        agent = await create_surfsense_deep_agent(
            llm=llm,
            search_space_id=search_space_id,
            db_session=session,
            connector_service=connector_service,
            checkpointer=checkpointer,
            user_id=user_id,
            thread_id=chat_id,
            agent_config=agent_config,
            firecrawl_api_key=firecrawl_api_key,
            thread_visibility=visibility,
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
