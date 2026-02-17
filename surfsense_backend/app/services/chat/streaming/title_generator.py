"""
Title generator for streaming chat.

Handles automatic LLM-based title generation for new chat threads.
"""

from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db import NewChatMessage, NewChatThread
from app.prompts import TITLE_GENERATION_PROMPT_TEMPLATE
from app.services.new_streaming_service import VercelStreamingService


async def generate_and_update_title(
    llm: Any,
    user_query: str,
    accumulated_text: str,
    chat_id: int,
    session: AsyncSession,
    streaming_service: VercelStreamingService,
) -> AsyncGenerator[str, None]:
    """
    Generate and update chat title for first assistant response.

    This function:
    1. Checks if this is the first assistant response
    2. Generates a title using the LLM
    3. Updates the database
    4. Yields SSE event to notify frontend

    Args:
        llm: The LLM instance for title generation
        user_query: The user's original query
        accumulated_text: The assistant's complete response
        chat_id: Chat thread ID
        session: Database session
        streaming_service: Service for formatting SSE events

    Yields:
        str: SSE-formatted title update event (if title generated)
    """
    # Check if this is the first assistant response by counting existing assistant messages
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
            # Silently fail if title generation fails (keep default title)
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
