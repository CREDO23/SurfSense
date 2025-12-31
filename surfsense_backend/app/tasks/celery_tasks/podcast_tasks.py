"""Celery tasks for podcast generation."""

import asyncio
import logging
import sys

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.celery_app import celery_app
from app.config import config
from app.services.podcast import PodcastGenerationService

logger = logging.getLogger(__name__)

if sys.platform.startswith("win"):
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    except AttributeError:
        logger.warning(
            "WindowsProactorEventLoopPolicy is unavailable; async subprocess support may fail."
        )


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


@celery_app.task(name="generate_content_podcast", bind=True)
def generate_content_podcast_task(
    self,
    source_content: str,
    search_space_id: int,
    podcast_title: str = "SurfSense Podcast",
    user_prompt: str | None = None,
) -> dict:
    """
    Celery task to generate podcast from source content (for new-chat).

    This task generates a podcast directly from provided content.

    Args:
        source_content: The text content to convert into a podcast
        search_space_id: ID of the search space
        podcast_title: Title for the podcast
        user_prompt: Optional instructions for podcast style/tone

    Returns:
        dict with podcast_id on success, or error info on failure
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(
            _generate_content_podcast(
                source_content,
                search_space_id,
                podcast_title,
                user_prompt,
            )
        )
        loop.run_until_complete(loop.shutdown_asyncgens())
        return result
    except Exception as e:
        logger.error(f"Error generating content podcast: {e!s}")
        return {"status": "error", "error": str(e)}
    finally:
        # Always clear the active podcast key when task completes (success or failure)
        PodcastGenerationService.clear_active_podcast_redis_key(search_space_id)
        asyncio.set_event_loop(None)
        loop.close()


async def _generate_content_podcast(
    source_content: str,
    search_space_id: int,
    podcast_title: str = "SurfSense Podcast",
    user_prompt: str | None = None,
) -> dict:
    """Generate content-based podcast with new session."""
    async with get_celery_session_maker()() as session:
        return await PodcastGenerationService.generate_content_podcast(
            session=session,
            source_content=source_content,
            search_space_id=search_space_id,
            podcast_title=podcast_title,
            user_prompt=user_prompt,
        )
