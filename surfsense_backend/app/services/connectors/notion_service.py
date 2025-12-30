"""Notion connector service."""

from datetime import datetime
from typing import Any

from app.services.connectors.base import BaseConnectorService


class NotionConnectorService(BaseConnectorService):
    """Service for searching Notion documents."""

    CONNECTOR_ID = 5
    CONNECTOR_NAME = "Notion"
    CONNECTOR_TYPE = "NOTION_CONNECTOR"

    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search for Notion pages.

        Uses combined chunk-level and document-level hybrid search with RRF fusion.

        Args:
            user_query: The user's query
            search_space_id: The search space ID to search in
            top_k: Maximum number of results to return
            start_date: Optional start date for filtering documents
            end_date: Optional end date for filtering documents

        Returns:
            tuple: (sources_info, langchain_documents)
        """
        notion_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=search_space_id,
            document_type=self.CONNECTOR_TYPE,
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )

        if not notion_docs:
            return {
                "id": self.CONNECTOR_ID,
                "name": self.CONNECTOR_NAME,
                "type": self.CONNECTOR_TYPE,
                "sources": [],
            }, []

        def _title_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            page_title = metadata.get("page_title", "Untitled Page")
            indexed_at = metadata.get("indexed_at", "")
            title = f"Notion: {page_title}"
            if indexed_at:
                title += f" (indexed: {indexed_at})"
            return title

        def _url_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            page_id = metadata.get("page_id", "")
            return f"https://notion.so/{page_id.replace('-', '')}" if page_id else ""

        sources_list = self._build_chunk_sources_from_documents(
            notion_docs,
            title_fn=_title_fn,
            url_fn=_url_fn,
            description_fn=lambda chunk, _doc_info, _metadata: chunk.get("content", ""),
        )

        result_object = {
            "id": self.CONNECTOR_ID,
            "name": self.CONNECTOR_NAME,
            "type": self.CONNECTOR_TYPE,
            "sources": sources_list,
        }

        return result_object, notion_docs
