from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class LumaConnectorService(BaseConnectorService):
    """Service for searching Luma Events."""  

    CONNECTOR_ID = 18
    CONNECTOR_NAME = "Luma Events"
    CONNECTOR_TYPE = "LUMA_CONNECTOR"
    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """
        Search for Luma events and return both the source information and langchain documents.

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
        luma_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=search_space_id,
            document_type=self.CONNECTOR_TYPE,
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )

        # Early return if no results
        if not luma_docs:
            return {
                "id": 33,
                "name": self.CONNECTOR_NAME,
                "type": self.CONNECTOR_TYPE,
                "sources": [],
            }, []

        def _title_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            event_name = metadata.get("event_name", "Untitled Event")
            start_time = metadata.get("start_time", "")
            return (
                f"Luma: {event_name} ({start_time})"
                if start_time
                else f"Luma: {event_name}"
            )

        def _url_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            return metadata.get("event_url", "") or ""

        def _description_fn(
            chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> str:
            description = chunk.get("content", "")
            info_parts = []
            if metadata.get("location_name"):
                info_parts.append(f"Venue: {metadata.get('location_name')}")
            elif metadata.get("location_address"):
                info_parts.append(f"Location: {metadata.get('location_address')}")
            if metadata.get("meeting_url"):
                info_parts.append("Online Event")
            if metadata.get("end_time"):
                info_parts.append(f"Ends: {metadata.get('end_time')}")
            if metadata.get("timezone"):
                info_parts.append(f"TZ: {metadata.get('timezone')}")
            if metadata.get("visibility"):
                info_parts.append(
                    f"Visibility: {str(metadata.get('visibility')).title()}"
                )
            if info_parts:
                description = (description + " | " + " | ".join(info_parts)).strip(" |")
            return description

        def _extra_fields_fn(
            _chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> dict[str, Any]:
            return {
                "event_id": metadata.get("event_id", ""),
                "event_name": metadata.get("event_name", "Untitled Event"),
                "start_time": metadata.get("start_time", ""),
                "end_time": metadata.get("end_time", ""),
                "location_name": metadata.get("location_name", ""),
                "location_address": metadata.get("location_address", ""),
                "meeting_url": metadata.get("meeting_url", ""),
                "timezone": metadata.get("timezone", ""),
                "visibility": metadata.get("visibility", ""),
            }

        sources_list = self._build_chunk_sources_from_documents(
            luma_docs,
            title_fn=_title_fn,
            url_fn=_url_fn,
            description_fn=_description_fn,
            extra_fields_fn=_extra_fields_fn,
        )

        # Create result object
        result_object = {
            "id": 33,  # Assign a unique ID for the Luma connector
            "name": self.CONNECTOR_NAME,
            "type": self.CONNECTOR_TYPE,
            "sources": sources_list,
        }

        return result_object, luma_docs

