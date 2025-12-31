"""
Streaming task for the new SurfSense deep agent chat.

This module streams responses from the deep agent using the Vercel AI SDK
Data Stream Protocol (SSE format).

Supports loading LLM configurations from:
- YAML files (negative IDs for global configs)
- NewLLMConfig database table (positive IDs for user-created configs with prompt settings)
"""

import json
import logging
from collections.abc import AsyncGenerator

from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import Document
from app.schemas.new_chat import ChatAttachment
from app.services.new_streaming_service import VercelStreamingService
from app.tasks.chat.config import (
    create_configured_agent,
    load_llm_instance,
    setup_connector_service,
)
from app.tasks.chat.context import (
    extract_todos_from_deepagents,
    format_attachments_as_context,
    format_mentioned_documents_as_context,
)
from app.tasks.chat.streaming import (
    StreamStateTracker,
    build_initial_analyzing_step,
    handle_chat_model_stream,
    handle_tool_end,
    handle_tool_start,
)

logger = logging.getLogger(__name__)


async def stream_new_chat(
    user_query: str,
    search_space_id: int,
    chat_id: int,
    session: AsyncSession,
    llm_config_id: int = -1,
    attachments: list[ChatAttachment] | None = None,
    mentioned_document_ids: list[int] | None = None,
) -> AsyncGenerator[str, None]:
    """
    Stream chat responses from the new SurfSense deep agent.

    This uses the Vercel AI SDK Data Stream Protocol (SSE format) for streaming.
    The chat_id is used as LangGraph's thread_id for memory/checkpointing.
    Message history can be passed from the frontend for context.

    Args:
        user_query: The user's query
        search_space_id: The search space ID
        chat_id: The chat ID (used as LangGraph thread_id for memory)
        session: The database session
        llm_config_id: The LLM configuration ID (default: -1 for first global config)
        messages: Optional chat history from frontend (list of ChatMessage)
        attachments: Optional attachments with extracted content
        mentioned_document_ids: Optional list of document IDs mentioned with @ in the chat

    Yields:
        str: SSE formatted response strings
    """
    streaming_service = VercelStreamingService()

    # Track the current text block for streaming (defined early for exception handling)
    current_text_id: str | None = None

    try:
        # Load LLM instance and config
        llm, agent_config, error_msg = await load_llm_instance(
            session, llm_config_id, search_space_id
        )
        if error_msg:
            yield streaming_service.format_error(error_msg)
            yield streaming_service.format_done()
            return

        # Set up connector service and get Firecrawl API key
        connector_service, firecrawl_api_key = await setup_connector_service(
            session, search_space_id
        )

        # Create configured agent
        agent = await create_configured_agent(
            llm, search_space_id, session, connector_service, agent_config, firecrawl_api_key
        )

        # Build input with message history from frontend
        langchain_messages = []

        # Fetch mentioned documents if any
        mentioned_documents: list[Document] = []
        if mentioned_document_ids:
            result = await session.execute(
                select(Document).filter(
                    Document.id.in_(mentioned_document_ids),
                    Document.search_space_id == search_space_id,
                )
            )
            mentioned_documents = list(result.scalars().all())

        # Format the user query with context (attachments + mentioned documents)
        final_query = user_query
        context_parts = []

        if attachments:
            context_parts.append(format_attachments_as_context(attachments))

        if mentioned_documents:
            context_parts.append(
                format_mentioned_documents_as_context(mentioned_documents)
            )

        if context_parts:
            context = "\n\n".join(context_parts)
            final_query = f"{context}\n\n<user_query>{user_query}</user_query>"

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
        config = {
            "configurable": {
                "thread_id": str(chat_id),
            },
            "recursion_limit": 80,  # Increase from default 25 to allow more tool iterations
        }

        # Start the message stream
        yield streaming_service.format_message_start()
        yield streaming_service.format_start_step()

        # Initialize state tracker
        state = StreamStateTracker()

        # Initial thinking step - analyzing the request
        analyze_step_id = state.next_thinking_step_id()
        state.last_active_step_id = analyze_step_id
        (
            state.last_active_step_title,
            state.last_active_step_items,
            initial_step_event,
        ) = build_initial_analyzing_step(
            user_query, attachments, mentioned_documents, streaming_service, analyze_step_id
        )
        yield initial_step_event

        # Stream the agent response with thread config for memory
        async for event in agent.astream_events(
            input_state, config=config, version="v2"
        ):
            event_type = event.get("event", "")

            if event_type == "on_chat_model_stream":
                async for evt in handle_chat_model_stream(event, state, streaming_service):
                    yield evt
            elif event_type == "on_tool_start":
                async for evt in handle_tool_start(event, state, streaming_service):
                    yield evt
            elif event_type == "on_tool_end":
                async for evt in handle_tool_end(event, state, streaming_service):
                    yield evt
            # Handle chain/agent end to close any open text blocks
            elif event_type in ("on_chain_end", "on_agent_end"):
                if state.current_text_id is not None:
                    yield streaming_service.format_text_end(state.current_text_id)
                    state.current_text_id = None

        # Ensure text block is closed
        if state.current_text_id is not None:
            yield streaming_service.format_text_end(state.current_text_id)

        # Mark the last active thinking step as completed
        completion_event = state.complete_current_step(streaming_service)
        if completion_event:
            yield completion_event

        # Finish the step and message
        yield streaming_service.format_finish_step()
        yield streaming_service.format_finish()
        yield streaming_service.format_done()


    except Exception as e:
        # Handle any errors
        error_message = f"Error during chat: {e!s}"
        logger.error(f"[stream_new_chat] {error_message}")

        # Close any open text block
        if state.current_text_id is not None:
            yield streaming_service.format_text_end(state.current_text_id)

        yield streaming_service.format_error(error_message)
        yield streaming_service.format_finish_step()
        yield streaming_service.format_finish()
        yield streaming_service.format_done()
