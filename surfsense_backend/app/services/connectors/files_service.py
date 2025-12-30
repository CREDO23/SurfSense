from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class FilesConnectorService(BaseConnectorService):
    """Service for searching uploaded files."""

    CONNECTOR_ID = 2
    CONNECTOR_NAME = "Files"
    CONNECTOR_TYPE = "FILE"

    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """
        Search for files and return both the source information and langchain documents.

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
        files_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=search_space_id,
            document_type=self.CONNECTOR_TYPE,
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )

        # Early return if no results
        if not files_docs:
            return {
                "id": self.CONNECTOR_ID,
                "name": self.CONNECTOR_NAME,
                "type": self.CONNECTOR_TYPE,
                "sources": [],
            }, []

        def _description_fn(
            chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> str:
            return (
                metadata.get("og:description")
                or metadata.get("ogDescription")
                or self._chunk_preview(chunk.get("content", ""))
            )

        sources_list = self._build_chunk_sources_from_documents(
            files_docs,
            description_fn=_description_fn,
            url_fn=lambda _doc_info, metadata: metadata.get("url", "") or "",
        )

        # Create result object
        result_object = {
            "id": self.CONNECTOR_ID,
            "name": self.CONNECTOR_NAME,
            "type": self.CONNECTOR_TYPE,
            "sources": sources_list,
        }

        return result_object, files_docs
