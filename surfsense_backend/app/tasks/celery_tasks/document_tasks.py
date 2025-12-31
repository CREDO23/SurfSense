"""Celery tasks for document processing."""

import logging

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.config import config

logger = logging.getLogger(__name__)


def get_celery_session_maker():
    """
    Create a new async session maker for Celery tasks.
    This is necessary because Celery tasks run in a new event loop,
    and the default session maker is bound to the main app's event loop.
    """
    engine = create_async_engine(
        config.DATABASE_URL,
        poolclass=NullPool,  # Don't use connection pooling for Celery tasks
        echo=False,
    )
    return async_sessionmaker(engine, expire_on_commit=False)


# Re-export tasks from modularized modules for backward compatibility
from app.tasks.celery_tasks.document_tasks import (
    process_extension_document_task,
    process_file_upload_task,
    process_youtube_video_task,
)

__all__ = [
    "get_celery_session_maker",
    "process_extension_document_task",
    "process_youtube_video_task",
    "process_file_upload_task",
]
