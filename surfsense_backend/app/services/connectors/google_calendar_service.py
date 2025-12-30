from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class GoogleCalendarConnectorService(BaseConnectorService):
    """Service for searching Google Calendar Events."""  

    CONNECTOR_ID = 11
    CONNECTOR_NAME = "Google Calendar Events"
    CONNECTOR_TYPE = "GOOGLE_CALENDAR_CONNECTOR"
    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """
        Search for Google Calendar events and return both the source information and langchain documents.

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
        calendar_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=search_space_id,
            document_type=self.CONNECTOR_TYPE,
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )

        # Early return if no results
        if not calendar_docs:
            return {
                "id": 31,
                "name": self.CONNECTOR_NAME,
                "type": self.CONNECTOR_TYPE,
                "sources": [],
            }, []

        def _title_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            event_summary = metadata.get("event_summary", "Untitled Event")
            start_time = metadata.get("start_time", "")
            title = f"Calendar: {event_summary}"
            if start_time:
                title += f" ({start_time})"
            return title

        def _url_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            event_id = metadata.get("event_id", "")
            calendar_id = metadata.get("calendar_id", "")
            return (
                f"https://calendar.google.com/calendar/event?eid={event_id}"
                if event_id and calendar_id
                else ""
            )

        def _description_fn(
            chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> str:
            description = chunk.get("content", "")
            info_parts = []
            location = metadata.get("location", "")
            calendar_id = metadata.get("calendar_id", "")
            end_time = metadata.get("end_time", "")
            if location:
                info_parts.append(f"Location: {location}")
            if calendar_id and calendar_id != "primary":
                info_parts.append(f"Calendar: {calendar_id}")
            if end_time:
                info_parts.append(f"End: {end_time}")
            if info_parts:
                description = (description + " | " + " | ".join(info_parts)).strip(" |")
            return description

        def _extra_fields_fn(
            _chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> dict[str, Any]:
            return {
                "event_id": metadata.get("event_id", ""),
                "event_summary": metadata.get("event_summary", "Untitled Event"),
                "calendar_id": metadata.get("calendar_id", ""),
                "start_time": metadata.get("start_time", ""),
                "end_time": metadata.get("end_time", ""),
                "location": metadata.get("location", ""),
            }

        sources_list = self._build_chunk_sources_from_documents(
            calendar_docs,
            title_fn=_title_fn,
            url_fn=_url_fn,
            description_fn=_description_fn,
            extra_fields_fn=_extra_fields_fn,
        )

        # Create result object
        result_object = {
            "id": 31,  # Assign a unique ID for the Google Calendar connector
            "name": self.CONNECTOR_NAME,
            "type": self.CONNECTOR_TYPE,
            "sources": sources_list,
        }

        return result_object, calendar_docs

