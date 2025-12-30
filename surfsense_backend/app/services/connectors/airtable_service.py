from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class AirtableConnectorService(BaseConnectorService):
    """Service for searching Airtable Records."""  

    CONNECTOR_ID = 12
    CONNECTOR_NAME = "Airtable Records"
    CONNECTOR_TYPE = "AIRTABLE_CONNECTOR"
    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """
        Search for Airtable records and return both the source information and langchain documents.

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
        airtable_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=search_space_id,
            document_type=self.CONNECTOR_TYPE,
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )

        # Early return if no results
        if not airtable_docs:
            return {
                "id": 32,
                "name": self.CONNECTOR_NAME,
                "type": self.CONNECTOR_TYPE,
                "sources": [],
            }, []

        def _title_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            record_id = metadata.get("record_id", "")
            return f"Airtable Record: {record_id}" if record_id else "Airtable Record"

        def _description_fn(
            _chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> str:
            created_time = metadata.get("created_time", "")
            return f"Created: {created_time}" if created_time else ""

        def _extra_fields_fn(
            _chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> dict[str, Any]:
            return {
                "record_id": metadata.get("record_id", ""),
                "created_time": metadata.get("created_time", ""),
            }

        sources_list = self._build_chunk_sources_from_documents(
            airtable_docs,
            title_fn=_title_fn,
            url_fn=lambda _doc_info, _metadata: "",
            description_fn=_description_fn,
            extra_fields_fn=_extra_fields_fn,
        )

        result_object = {
            "id": 32,
            "name": self.CONNECTOR_NAME,
            "type": self.CONNECTOR_TYPE,
            "sources": sources_list,
        }

        return result_object, airtable_docs

