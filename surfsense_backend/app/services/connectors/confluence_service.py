from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class ConfluenceConnectorService(BaseConnectorService):
    """Service for searching Confluence Pages."""  

    CONNECTOR_ID = 14
    CONNECTOR_NAME = "Confluence Pages"
    CONNECTOR_TYPE = "CONFLUENCE_CONNECTOR"
    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """
        Search for Confluence pages and return both the source information and langchain documents.

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
        confluence_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=search_space_id,
            document_type=self.CONNECTOR_TYPE,
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )

        # Early return if no results
        if not confluence_docs:
            return {
                "id": 40,
                "name": "Confluence",
                "type": self.CONNECTOR_TYPE,
                "sources": [],
            }, []

        def _title_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            page_title = metadata.get("page_title", "Untitled Page")
            space_key = metadata.get("space_key", "")
            title = f"Confluence: {page_title}"
            if space_key:
                title += f" ({space_key})"
            return title

        def _url_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            page_id = metadata.get("page_id", "")
            base_url = metadata.get("base_url", "")
            return f"{base_url}/pages/{page_id}" if base_url and page_id else ""

        sources_list = self._build_chunk_sources_from_documents(
            confluence_docs,
            title_fn=_title_fn,
            url_fn=_url_fn,
            description_fn=lambda chunk, _doc_info, _metadata: chunk.get("content", ""),
        )

        # Create result object
        result_object = {
            "id": 40,
            "name": "Confluence",
            "type": self.CONNECTOR_TYPE,
            "sources": sources_list,
        }

        return result_object, confluence_docs

