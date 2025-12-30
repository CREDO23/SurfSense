from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class ElasticsearchConnectorService(BaseConnectorService):
    """Service for searching Elasticsearch."""  

    CONNECTOR_ID = 19
    CONNECTOR_NAME = "Elasticsearch"
    CONNECTOR_TYPE = "ELASTICSEARCH_CONNECTOR"
    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """
        Search for Elasticsearch documents and return both the source information and langchain documents.

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
        elasticsearch_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=search_space_id,
            document_type=self.CONNECTOR_TYPE,
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )

        # Early return if no results
        if not elasticsearch_docs:
            return {
                "id": 34,
                "name": self.CONNECTOR_NAME,
                "type": self.CONNECTOR_TYPE,
                "sources": [],
            }, []

        def _title_fn(doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            title = doc_info.get("title", "Elasticsearch Document")
            es_index = metadata.get("elasticsearch_index", "")
            return f"{title} (Index: {es_index})" if es_index else title

        def _description_fn(
            chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> str:
            description = self._chunk_preview(chunk.get("content", ""), limit=150)
            info_parts = []
            if metadata.get("elasticsearch_id"):
                info_parts.append(f"ID: {metadata.get('elasticsearch_id')}")
            if metadata.get("elasticsearch_score"):
                info_parts.append(f"Score: {metadata.get('elasticsearch_score')}")
            if info_parts:
                description = (description + " | " + " | ".join(info_parts)).strip(" |")
            return description

        def _extra_fields_fn(
            _chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> dict[str, Any]:
            return {
                "elasticsearch_id": metadata.get("elasticsearch_id", ""),
                "elasticsearch_index": metadata.get("elasticsearch_index", ""),
                "elasticsearch_score": metadata.get("elasticsearch_score", ""),
            }

        sources_list = self._build_chunk_sources_from_documents(
            elasticsearch_docs,
            title_fn=_title_fn,
            url_fn=lambda _doc_info, _metadata: "",
            description_fn=_description_fn,
            extra_fields_fn=_extra_fields_fn,
        )

        # Create result object
        result_object = {
            "id": 34,  # Assign a unique ID for the Elasticsearch connector
            "name": self.CONNECTOR_NAME,
            "type": self.CONNECTOR_TYPE,
            "sources": sources_list,
        }

        return result_object, elasticsearch_docs

