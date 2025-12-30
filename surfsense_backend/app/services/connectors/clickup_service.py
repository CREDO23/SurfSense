from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class ClickupConnectorService(BaseConnectorService):
    """Service for searching ClickUp Tasks."""  

    CONNECTOR_ID = 15
    CONNECTOR_NAME = "ClickUp Tasks"
    CONNECTOR_TYPE = "CLICKUP_CONNECTOR"
    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """
        Search for ClickUp tasks and return both the source information and langchain documents.

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
        clickup_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=search_space_id,
            document_type=self.CONNECTOR_TYPE,
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )

        # Early return if no results
        if not clickup_docs:
            return {
                "id": 31,
                "name": self.CONNECTOR_NAME,
                "type": self.CONNECTOR_TYPE,
                "sources": [],
            }, []

        def _title_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            return metadata.get("task_name", "ClickUp Task")

        def _url_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            return metadata.get("task_url", "") or ""

        def _description_fn(
            _chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> str:
            parts = []
            if metadata.get("task_status"):
                parts.append(f"Status: {metadata.get('task_status')}")
            if metadata.get("task_priority"):
                parts.append(f"Priority: {metadata.get('task_priority')}")
            if metadata.get("task_due_date"):
                parts.append(f"Due: {metadata.get('task_due_date')}")
            if metadata.get("task_list_name"):
                parts.append(f"List: {metadata.get('task_list_name')}")
            if metadata.get("task_space_name"):
                parts.append(f"Space: {metadata.get('task_space_name')}")
            return " | ".join(parts) if parts else "ClickUp Task"

        def _extra_fields_fn(
            _chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> dict[str, Any]:
            return {
                "task_id": metadata.get("task_id", ""),
                "status": metadata.get("task_status", ""),
                "priority": metadata.get("task_priority", ""),
                "assignees": metadata.get("task_assignees", []),
                "due_date": metadata.get("task_due_date", ""),
                "list_name": metadata.get("task_list_name", ""),
                "space_name": metadata.get("task_space_name", ""),
            }

        sources_list = self._build_chunk_sources_from_documents(
            clickup_docs,
            title_fn=_title_fn,
            url_fn=_url_fn,
            description_fn=_description_fn,
            extra_fields_fn=_extra_fields_fn,
        )

        # Create result object
        result_object = {
            "id": 31,  # Assign a unique ID for the ClickUp connector
            "name": self.CONNECTOR_NAME,
            "type": self.CONNECTOR_TYPE,
            "sources": sources_list,
        }

        return result_object, clickup_docs

