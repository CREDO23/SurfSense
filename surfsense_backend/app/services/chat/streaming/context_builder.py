"""
Context builder for streaming chat.

Handles building the complete message input with context:
- History bootstrapping for cloned chats
- Fetching mentioned documents
- Fetching mentioned SurfSense docs
- Context formatting
- User message construction
"""

from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db import ChatVisibility, Document, NewChatThread, SurfsenseDocsDocument
from app.services.chat.streaming.context_formatters import (
    format_mentioned_documents_as_context,
    format_mentioned_surfsense_docs_as_context,
)
from app.utils.content_utils import bootstrap_history_from_db


async def build_agent_context(
    user_query: str,
    search_space_id: int,
    chat_id: int,
    session: AsyncSession,
    thread_visibility: ChatVisibility | None = None,
    mentioned_document_ids: list[int] | None = None,
    mentioned_surfsense_doc_ids: list[int] | None = None,
    needs_history_bootstrap: bool = False,
    current_user_display_name: str | None = None,
) -> dict:
    """
    Build the complete context for the agent.

    Args:
        user_query: The user's query
        search_space_id: Search space ID
        chat_id: Chat ID
        session: Database session
        thread_visibility: Thread visibility setting (defaults to PRIVATE)
        mentioned_document_ids: Optional list of document IDs mentioned with @
        mentioned_surfsense_doc_ids: Optional list of SurfSense doc IDs mentioned with @
        needs_history_bootstrap: If True, load message history from DB (for cloned chats)
        current_user_display_name: Optional display name for search space chats

    Returns:
        dict: Input state ready for agent with 'messages' and 'search_space_id'
    """
    visibility = thread_visibility or ChatVisibility.PRIVATE
    langchain_messages = []

    # Bootstrap history for cloned chats (no LangGraph checkpoint exists yet)
    if needs_history_bootstrap:
        langchain_messages = await bootstrap_history_from_db(
            session, chat_id, thread_visibility=visibility
        )

        # Clear the flag so we don't bootstrap again on next message
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
        result = await session.execute(
            select(Document)
            .options(selectinload(Document.chunks))
            .filter(
                Document.id.in_(mentioned_document_ids),
                Document.search_space_id == search_space_id,
            )
        )
        mentioned_documents = list(result.scalars().all())

    # Fetch mentioned SurfSense docs if any
    mentioned_surfsense_docs: list[SurfsenseDocsDocument] = []
    if mentioned_surfsense_doc_ids:
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

    langchain_messages.append(HumanMessage(content=final_query))

    input_state = {
        "messages": langchain_messages,
        "search_space_id": search_space_id,
    }

    return input_state
