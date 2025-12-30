from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class CrawledUrlsConnectorService(BaseConnectorService):
    """Service for searching crawled URLs."""

    CONNECTOR_ID = 1
    CONNECTOR_NAME = "Crawled URLs"
    CONNECTOR_TYPE = "CRAWLED_URL"

    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """
        Search for crawled URLs and return both the source information and langchain documents.

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
        crawled_urls_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=search_space_id,
            document_type=self.CONNECTOR_TYPE,
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )

        # Early return if no results
        if not crawled_urls_docs:
            return {
                "id": self.CONNECTOR_ID,
                "name": self.CONNECTOR_NAME,
                "type": self.CONNECTOR_TYPE,
                "sources": [],
            }, []

        def _title_fn(doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            return doc_info.get("title") or metadata.get("title") or "Untitled Document"

        def _url_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            return metadata.get("source") or metadata.get("url") or ""

        def _description_fn(
            chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> str:
            description = metadata.get("description") or self._chunk_preview(
                chunk.get("content", "")
            )
            info_parts = []
            language = metadata.get("language", "")
            last_crawled_at = metadata.get("last_crawled_at", "")
            if language:
                info_parts.append(f"Language: {language}")
            if last_crawled_at:
                info_parts.append(f"Last crawled: {last_crawled_at}")
            if info_parts:
                description = (description + " | " + " | ".join(info_parts)).strip(" |")
            return description

        def _extra_fields_fn(
            _chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> dict[str, Any]:
            return {
                "language": metadata.get("language", ""),
                "last_crawled_at": metadata.get("last_crawled_at", ""),
            }

        sources_list = self._build_chunk_sources_from_documents(
            crawled_urls_docs,
            title_fn=_title_fn,
            description_fn=_description_fn,
            url_fn=_url_fn,
            extra_fields_fn=_extra_fields_fn,
        )

        # Create result object
        result_object = {
            "id": self.CONNECTOR_ID,
            "name": self.CONNECTOR_NAME,
            "type": self.CONNECTOR_TYPE,
            "sources": sources_list,
        }

        return result_object, crawled_urls_docs
