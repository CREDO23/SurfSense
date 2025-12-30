from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class BookstackConnectorService(BaseConnectorService):
    """Service for searching BookStack."""  

    CONNECTOR_ID = 21
    CONNECTOR_NAME = "BookStack"
    CONNECTOR_TYPE = "BOOKSTACK_CONNECTOR"
    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """
        Search for BookStack pages and return both the source information and langchain documents.

        Uses combined chunk-level and document-level hybrid search with RRF fusion.

        Args:
            user_query: The user's query
            user_id: The user's ID
            search_space_id: The search space ID to search in
            top_k: Maximum number of results to return
            start_date: Optional start date for filtering documents by updated_at
            end_date: Optional end date for filtering documents by updated_at

        Returns:
            tuple: (sources_info, langchain_documents)
        """
        bookstack_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=search_space_id,
            document_type=self.CONNECTOR_TYPE,
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )

        # Early return if no results
        if not bookstack_docs:
            return {
                "id": 50,
                "name": self.CONNECTOR_NAME,
                "type": self.CONNECTOR_TYPE,
                "sources": [],
            }, []

        def _title_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            page_name = metadata.get("page_name", "Untitled Page")
            return f"BookStack: {page_name}"

        def _url_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            page_slug = metadata.get("page_slug", "")
            book_slug = metadata.get("book_slug", "")
            base_url = metadata.get("base_url", "")
            page_url = metadata.get("page_url", "")
            if page_url:
                return page_url
            if base_url and book_slug and page_slug:
                return f"{base_url}/books/{book_slug}/page/{page_slug}"
            return ""

        sources_list = self._build_chunk_sources_from_documents(
            bookstack_docs,
            title_fn=_title_fn,
            url_fn=_url_fn,
            description_fn=lambda chunk, _doc_info, _metadata: chunk.get("content", ""),
        )

        # Create result object
        result_object = {
            "id": 50,  # Assign a unique ID for the BookStack connector
            "name": self.CONNECTOR_NAME,
            "type": self.CONNECTOR_TYPE,
            "sources": sources_list,
        }

        return result_object, bookstack_docs
