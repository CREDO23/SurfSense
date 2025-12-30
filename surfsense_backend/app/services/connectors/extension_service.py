from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class ExtensionConnectorService(BaseConnectorService):
    """Service for searching browser extension data."""

    CONNECTOR_ID = 6
    CONNECTOR_NAME = "Extension"
    CONNECTOR_TYPE = "EXTENSION"

    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """
        Search for extension data and return both the source information and langchain documents.

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
        extension_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=search_space_id,
            document_type=self.CONNECTOR_TYPE,
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )

        # Early return if no results
        if not extension_docs:
            return {
                "id": self.CONNECTOR_ID,
                "name": self.CONNECTOR_NAME,
                "type": self.CONNECTOR_TYPE,
                "sources": [],
            }, []

        def _title_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            webpage_title = metadata.get("VisitedWebPageTitle", "Untitled Page")
            visit_date = metadata.get("VisitedWebPageDateWithTimeInISOString", "")
            title = webpage_title
            if visit_date:
                try:
                    formatted_date = (
                        visit_date.split("T")[0] if "T" in visit_date else visit_date
                    )
                    title += f" (visited: {formatted_date})"
                except Exception:
                    title += f" (visited: {visit_date})"
            return title

        def _url_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            return metadata.get("VisitedWebPageURL", "") or ""

        def _description_fn(
            chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> str:
            description = chunk.get("content", "")
            visit_duration = metadata.get(
                "VisitedWebPageVisitDurationInMilliseconds", ""
            )
            if visit_duration:
                try:
                    duration_seconds = int(visit_duration) / 1000
                    duration_text = (
                        f"{duration_seconds:.1f} seconds"
                        if duration_seconds < 60
                        else f"{duration_seconds / 60:.1f} minutes"
                    )
                    description = (description + f" | Duration: {duration_text}").strip(
                        " |"
                    )
                except Exception:
                    pass
            return description

        sources_list = self._build_chunk_sources_from_documents(
            extension_docs,
            title_fn=_title_fn,
            url_fn=_url_fn,
            description_fn=_description_fn,
        )

        # Create result object
        result_object = {
            "id": self.CONNECTOR_ID,
            "name": self.CONNECTOR_NAME,
            "type": self.CONNECTOR_TYPE,
            "sources": sources_list,
        }

        return result_object, extension_docs
