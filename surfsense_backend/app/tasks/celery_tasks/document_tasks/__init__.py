"""Document processing tasks module.

This module provides modularized document processing tasks using
the Template Method pattern to eliminate code duplication.
"""

from app.tasks.celery_tasks.document_tasks.extension_task import (
    process_extension_document_task,
)
from app.tasks.celery_tasks.document_tasks.file_upload_task import (
    process_file_upload_task,
)
from app.tasks.celery_tasks.document_tasks.youtube_task import (
    process_youtube_video_task,
)

__all__ = [
    "process_extension_document_task",
    "process_youtube_video_task",
    "process_file_upload_task",
]
