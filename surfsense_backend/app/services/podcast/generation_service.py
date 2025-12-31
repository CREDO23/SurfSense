"""Service for generating podcasts from content using LangGraph.

Extracts the podcast generation workflow into a testable, reusable service.
"""

import logging
import os
from typing import Optional

import redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Podcast

logger = logging.getLogger(__name__)


class PodcastGenerationService:
    """Service for generating podcasts from content."""

    @staticmethod
    def clear_active_podcast_redis_key(search_space_id: int) -> None:
        """Clear the active podcast task key from Redis when task completes.
        
        Args:
            search_space_id: ID of the search space
        """
        try:
            redis_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
            client = redis.from_url(redis_url, decode_responses=True)
            key = f"podcast:active:{search_space_id}"
            client.delete(key)
            logger.info(f"Cleared active podcast key for search_space_id={search_space_id}")
        except Exception as e:
            logger.warning(f"Could not clear active podcast key: {e}")

    @staticmethod
    def prepare_graph_config(
        podcast_title: str,
        search_space_id: int,
        user_prompt: Optional[str],
    ) -> dict:
        """Prepare configuration for the podcaster graph.
        
        Args:
            podcast_title: Title for the podcast
            search_space_id: ID of the search space
            user_prompt: Optional instructions for podcast style/tone
            
        Returns:
            Graph configuration dict
        """
        return {
            "configurable": {
                "podcast_title": podcast_title,
                "search_space_id": search_space_id,
                "user_prompt": user_prompt,
            }
        }

    @staticmethod
    async def run_podcaster_graph(
        session: AsyncSession,
        source_content: str,
        graph_config: dict,
    ) -> dict:
        """Execute the podcaster LangGraph workflow.
        
        Args:
            session: Database session
            source_content: The text content to convert into a podcast
            graph_config: Configuration for the podcaster graph
            
        Returns:
            Result dict from the graph execution
        """
        # Lazy import to avoid dependency issues when module is imported
        from app.agents.podcaster.graph import graph as podcaster_graph
        from app.agents.podcaster.state import State as PodcasterState
        
        initial_state = PodcasterState(
            source_content=source_content,
            db_session=session,
        )

        result = await podcaster_graph.ainvoke(initial_state, config=graph_config)
        logger.info("Podcaster graph execution completed")
        return result

    @staticmethod
    def extract_transcript(result: dict) -> list[dict]:
        """Extract and serialize podcast transcript from graph result.
        
        Args:
            result: Result dict from podcaster graph
            
        Returns:
            List of transcript entries with speaker_id and dialog
        """
        podcast_transcript = result.get("podcast_transcript", [])
        serializable_transcript = []
        
        for entry in podcast_transcript:
            if hasattr(entry, "speaker_id"):
                serializable_transcript.append(
                    {"speaker_id": entry.speaker_id, "dialog": entry.dialog}
                )
            else:
                serializable_transcript.append(
                    {
                        "speaker_id": entry.get("speaker_id", 0),
                        "dialog": entry.get("dialog", ""),
                    }
                )
        
        logger.info(f"Extracted {len(serializable_transcript)} transcript entries")
        return serializable_transcript

    @staticmethod
    async def save_podcast(
        session: AsyncSession,
        podcast_title: str,
        transcript: list[dict],
        file_path: str,
        search_space_id: int,
    ) -> Podcast:
        """Save generated podcast to database.
        
        Args:
            session: Database session
            podcast_title: Title for the podcast
            transcript: Serialized transcript entries
            file_path: Path to the generated audio file
            search_space_id: ID of the search space
            
        Returns:
            Created Podcast instance
        """
        podcast = Podcast(
            title=podcast_title,
            podcast_transcript=transcript,
            file_location=file_path,
            search_space_id=search_space_id,
        )
        session.add(podcast)
        await session.commit()
        await session.refresh(podcast)
        
        logger.info(f"Saved podcast to database with ID: {podcast.id}")
        return podcast

    @classmethod
    async def generate_content_podcast(
        cls,
        session: AsyncSession,
        source_content: str,
        search_space_id: int,
        podcast_title: str = "SurfSense Podcast",
        user_prompt: Optional[str] = None,
    ) -> dict:
        """Complete workflow for generating a podcast from content.
        
        This is the main entry point that orchestrates all steps.
        
        Args:
            session: Database session
            source_content: The text content to convert into a podcast
            search_space_id: ID of the search space
            podcast_title: Title for the podcast
            user_prompt: Optional instructions for podcast style/tone
            
        Returns:
            Dict with status, podcast_id, title, and transcript_entries count
            
        Raises:
            Exception: For errors during podcast generation
        """
        try:
            # Step 1: Configure the podcaster graph
            graph_config = cls.prepare_graph_config(
                podcast_title, search_space_id, user_prompt
            )

            # Step 2: Run the podcaster graph
            result = await cls.run_podcaster_graph(
                session, source_content, graph_config
            )

            # Step 3: Extract transcript and file path
            serializable_transcript = cls.extract_transcript(result)
            file_path = result.get("final_podcast_file_path", "")

            # Step 4: Save podcast to database
            podcast = await cls.save_podcast(
                session,
                podcast_title,
                serializable_transcript,
                file_path,
                search_space_id,
            )

            logger.info(f"Successfully generated content podcast: {podcast.id}")

            return {
                "status": "success",
                "podcast_id": podcast.id,
                "title": podcast_title,
                "transcript_entries": len(serializable_transcript),
            }

        except Exception as e:
            logger.error(f"Error in generate_content_podcast: {e!s}")
            await session.rollback()
            raise
