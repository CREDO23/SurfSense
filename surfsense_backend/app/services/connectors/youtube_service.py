from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class YoutubeConnectorService(BaseConnectorService):
    """Service for searching YouTube videos."""

    CONNECTOR_ID = 7
    CONNECTOR_NAME = "YouTube Videos"
    CONNECTOR_TYPE = "YOUTUBE_VIDEO"

    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """
        Search for YouTube videos and return both the source information and langchain documents.

        Uses combined chunk-level and document-level hybrid search with RRF fusion.

        Args:
            user_query: The user's query
            search_space_id: The search space ID to search in
            top_k: Maximum number of results to return
            start_date: Optional start date for filtering documents by updated_at
            end_date: Optional end date for filtering documents by updated_at

        Returns:
            tuple: (sources_info, langchain_documents)
        """
        youtube_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=search_space_id,
            document_type=self.CONNECTOR_TYPE,
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )

        # Early return if no results
        if not youtube_docs:
            return {
                "id": self.CONNECTOR_ID,
                "name": self.CONNECTOR_NAME,
                "type": self.CONNECTOR_TYPE,
                "sources": [],
            }, []

        def _title_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            video_title = metadata.get("video_title", "Untitled Video")
            channel_name = metadata.get("channel_name", "")
            return f"{video_title} - {channel_name}" if channel_name else video_title

        def _url_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            video_id = metadata.get("video_id", "")
            return f"https://www.youtube.com/watch?v={video_id}" if video_id else ""

        def _description_fn(
            chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> str:
            return metadata.get("description") or chunk.get("content", "")

        def _extra_fields_fn(
            _chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> dict[str, Any]:
            return {
                "video_id": metadata.get("video_id", ""),
                "channel_name": metadata.get("channel_name", ""),
            }

        sources_list = self._build_chunk_sources_from_documents(
            youtube_docs,
            title_fn=_title_fn,
            url_fn=_url_fn,
            description_fn=_description_fn,
            extra_fields_fn=_extra_fields_fn,
        )

        # Create result object
        result_object = {
            "id": self.CONNECTOR_ID,
            "name": self.CONNECTOR_NAME,
            "type": self.CONNECTOR_TYPE,
            "sources": sources_list,
        }

        return result_object, youtube_docs
