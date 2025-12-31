"""
Context formatting utilities for chat streaming.

This module contains helper functions to format various types of context
(attachments, mentioned documents, todos) for the chat agent.
"""

from app.tasks.chat.context.attachment_formatter import format_attachments_as_context
from app.tasks.chat.context.document_formatter import format_mentioned_documents_as_context
from app.tasks.chat.context.todo_extractor import extract_todos_from_deepagents

__all__ = [
    "format_attachments_as_context",
    "format_mentioned_documents_as_context",
    "extract_todos_from_deepagents",
]
