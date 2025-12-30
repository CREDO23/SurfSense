from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class NotesConnectorService(BaseConnectorService):
    """Service for searching Notes."""  

    CONNECTOR_ID = 20
    CONNECTOR_NAME = "Notes"
    CONNECTOR_TYPE = "NOTES_CONNECTOR"
    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """
        Search for Notes and return both the source information and langchain documents.

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
        notes_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=search_space_id,
            document_type="NOTE",
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )

        # Early return if no results
        if not notes_docs:
            return {
                "id": 51,
                "name": self.CONNECTOR_NAME,
                "type": "NOTE",
                "sources": [],
            }, []

        def _title_fn(doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            return doc_info.get("title", "Untitled Note")

        def _url_fn(_doc_info: dict[str, Any], _metadata: dict[str, Any]) -> str:
            return ""  # Notes don't have URLs

        def _description_fn(
            chunk: dict[str, Any], _doc_info: dict[str, Any], _metadata: dict[str, Any]
        ) -> str:
            return self._chunk_preview(chunk.get("content", ""), limit=200)

        sources_list = self._build_chunk_sources_from_documents(
            notes_docs,
            title_fn=_title_fn,
            url_fn=_url_fn,
            description_fn=_description_fn,
        )

        # Create result object
        result_object = {
            "id": 51,
            "name": self.CONNECTOR_NAME,
            "type": "NOTE",
            "sources": sources_list,
        }

        return result_object, notes_docs

