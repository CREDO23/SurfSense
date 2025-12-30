from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class DiscordConnectorService(BaseConnectorService):
    """Service for searching Discord Messages."""  

    CONNECTOR_ID = 17
    CONNECTOR_NAME = "Discord Messages"
    CONNECTOR_TYPE = "DISCORD_CONNECTOR"
    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """
        Search for Discord messages and return both the source information and langchain documents.

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
        discord_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=search_space_id,
            document_type=self.CONNECTOR_TYPE,
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )

        # Early return if no results
        if not discord_docs:
            return {
                "id": 11,
                "name": "Discord",
                "type": self.CONNECTOR_TYPE,
                "sources": [],
            }, []

        def _title_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            channel_name = metadata.get("channel_name", "Unknown Channel")
            message_date = metadata.get("start_date", "")
            title = f"Discord: {channel_name}"
            if message_date:
                title += f" ({message_date})"
            return title

        def _url_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            channel_id = metadata.get("channel_id", "")
            guild_id = metadata.get("guild_id", "")
            if guild_id and channel_id:
                return f"https://discord.com/channels/{guild_id}/{channel_id}"
            if channel_id:
                return f"https://discord.com/channels/@me/{channel_id}"
            return ""

        sources_list = self._build_chunk_sources_from_documents(
            discord_docs,
            title_fn=_title_fn,
            url_fn=_url_fn,
            description_fn=lambda chunk, _doc_info, _metadata: chunk.get("content", ""),
        )

        # Create result object
        result_object = {
            "id": 11,
            "name": "Discord",
            "type": self.CONNECTOR_TYPE,
            "sources": sources_list,
        }

        return result_object, discord_docs

