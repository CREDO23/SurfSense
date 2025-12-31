"""
New chat routes module for assistant-ui integration.

Combines all new_chat sub-routers:
- threads: CRUD operations for chat threads
- messages: Message append and listing
- streaming: Real-time chat streaming
- attachments: File attachment processing
"""

from fastapi import APIRouter

from . import attachments, messages, streaming, threads

router = APIRouter()

# Include all sub-routers
router.include_router(threads.router, tags=["threads"])
router.include_router(messages.router, tags=["messages"])
router.include_router(streaming.router, tags=["chat-streaming"])
router.include_router(attachments.router, tags=["attachments"])

__all__ = ["router"]
