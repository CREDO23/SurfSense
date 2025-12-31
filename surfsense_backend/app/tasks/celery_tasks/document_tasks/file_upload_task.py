"""File upload processing task."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.tasks.celery_tasks.document_tasks.base import BaseDocumentTask


class FileUploadTask(BaseDocumentTask):
    """Task for processing file uploads."""

    @property
    def task_name(self) -> str:
        return "process_file_upload"

    @property
    def source_type(self) -> str:
        return "document_processor"

    async def process(
        self,
        session: AsyncSession,
        search_space_id: int,
        user_id: str,
        file_path: str,
        filename: str,
    ):
        """Process file upload."""
        from app.tasks.document_processors.file_processors import (
            process_file_in_background,
        )

        # Note: process_file_in_background handles its own logging
        # via task_logger and log_entry parameters
        await process_file_in_background(
            file_path,
            filename,
            search_space_id,
            user_id,
            session,
            None,  # task_logger - handled by process_file_in_background
            None,  # log_entry - handled by process_file_in_background
        )
        # Return None to skip duplicate logging
        return None

    def get_log_metadata(self, file_path: str, filename: str, user_id: str) -> dict:
        """Get initial logging metadata."""
        return {
            "document_type": "FILE",
            "filename": filename,
            "file_path": file_path,
            "user_id": user_id,
        }

    def get_log_message(self, filename: str, file_path: str) -> str:
        """Get start log message."""
        return f"Starting file processing for: {filename}"

    def handle_exception(self, e: Exception, filename: str, **kwargs) -> tuple[str, bool]:
        """
        Handle exceptions with special handling for page limit errors.
        
        Returns:
            (error_message, should_raise)
        """
        from fastapi import HTTPException

        from app.services.page_limit_service import PageLimitExceededError

        # For page limit errors, use the detailed message from the exception
        if isinstance(e, PageLimitExceededError):
            error_message = str(e)
        elif isinstance(e, HTTPException) and "page limit" in str(e.detail).lower():
            error_message = str(e.detail)
        else:
            error_message = f"Failed to process file: {filename}"

        return (error_message, True)

    def get_failure_message(self, filename: str, **kwargs) -> str:
        """Get failure message."""
        return f"Failed to process file: {filename}"


# Create task instance
file_upload_task = FileUploadTask()

# Create Celery task
process_file_upload_task = file_upload_task.create_celery_task()
