"""Build initial analyzing step for chat streaming."""

from app.models import Document
from app.schemas.new_chat import ChatAttachment
from app.services.new_streaming_service import VercelStreamingService


def build_initial_analyzing_step(
    user_query: str,
    attachments: list[ChatAttachment] | None,
    mentioned_documents: list[Document],
    streaming_service: VercelStreamingService,
    step_id: str,
) -> tuple[str, str, list[str]]:
    """
    Build the initial "Analyzing your request" thinking step.
    
    Args:
        user_query: The user's query text
        attachments: Optional file attachments
        mentioned_documents: Documents mentioned with @
        streaming_service: Streaming service for formatting
        step_id: The step ID to use
    
    Returns:
        Tuple of (step_title, step_items_string, step_event)
    """
    # Determine step title and action verb based on context
    if attachments and mentioned_documents:
        title = "Analyzing your content"
        action_verb = "Reading"
    elif attachments:
        title = "Reading your content"
        action_verb = "Reading"
    elif mentioned_documents:
        title = "Analyzing referenced content"
        action_verb = "Analyzing"
    else:
        title = "Understanding your request"
        action_verb = "Processing"

    # Build the message with inline context about attachments/documents
    processing_parts = []

    # Add the user query
    query_text = user_query[:80] + ("..." if len(user_query) > 80 else "")
    processing_parts.append(query_text)

    # Add file attachment names inline
    if attachments:
        attachment_names = []
        for attachment in attachments:
            name = attachment.name
            if len(name) > 30:
                name = name[:27] + "..."
            attachment_names.append(name)
        if len(attachment_names) == 1:
            processing_parts.append(f"[{attachment_names[0]}]")
        else:
            processing_parts.append(f"[{len(attachment_names)} files]")

    # Add mentioned document names inline
    if mentioned_documents:
        doc_names = []
        for doc in mentioned_documents:
            doc_title = doc.title
            if len(doc_title) > 30:
                doc_title = doc_title[:27] + "..."
            doc_names.append(doc_title)
        if len(doc_names) == 1:
            processing_parts.append(f"[{doc_names[0]}]")
        else:
            processing_parts.append(f"[{len(doc_names)} documents]")

    items = [f"{action_verb}: {' '.join(processing_parts)}"]

    event = streaming_service.format_thinking_step(
        step_id=step_id,
        title=title,
        status="in_progress",
        items=items,
    )

    return title, items, event
