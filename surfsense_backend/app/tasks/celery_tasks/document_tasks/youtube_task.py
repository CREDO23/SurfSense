"""YouTube video processing task."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.tasks.celery_tasks.document_tasks.base import BaseDocumentTask
from app.tasks.document_processors import add_youtube_video_document


class YouTubeVideoTask(BaseDocumentTask):
    """Task for processing YouTube videos."""

    @property
    def task_name(self) -> str:
        return "process_youtube_video"

    @property
    def source_type(self) -> str:
        return "document_processor"

    async def process(
        self,
        session: AsyncSession,
        search_space_id: int,
        user_id: str,
        url: str,
    ):
        """Process YouTube video."""
        return await add_youtube_video_document(session, url, search_space_id, user_id)

    def get_log_metadata(self, url: str, user_id: str) -> dict:
        """Get initial logging metadata."""
        return {
            "document_type": "YOUTUBE_VIDEO",
            "url": url,
            "user_id": user_id,
        }

    def get_log_message(self, url: str) -> str:
        """Get start log message."""
        return f"Starting YouTube video processing for: {url}"

    def get_success_message(self, result, url: str) -> str:
        """Get success message."""
        if result:
            return f"Successfully processed YouTube video: {result.title}"
        return f"YouTube video document already exists (duplicate): {url}"

    def get_success_metadata(self, result, url: str) -> dict:
        """Get success metadata."""
        if result:
            return {
                "document_id": result.id,
                "video_id": result.document_metadata.get("video_id"),
                "content_hash": result.content_hash,
            }
        return {"duplicate_detected": True}

    def get_duplicate_message(self, url: str) -> str:
        """Get duplicate message."""
        return f"YouTube video document already exists (duplicate): {url}"

    def get_failure_message(self, url: str) -> str:
        """Get failure message."""
        return f"Failed to process YouTube video: {url}"


# Create task instance
youtube_task = YouTubeVideoTask()

# Create Celery task
process_youtube_video_task = youtube_task.create_celery_task()
