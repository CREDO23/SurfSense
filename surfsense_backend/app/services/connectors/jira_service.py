from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class JiraConnectorService(BaseConnectorService):
    """Service for searching Jira issues and comments."""

    CONNECTOR_ID = 10
    CONNECTOR_NAME = "Jira Issues"
    CONNECTOR_TYPE = "JIRA_CONNECTOR"

    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search for Jira issues and comments."""
        jira_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=search_space_id,
            document_type=self.CONNECTOR_TYPE,
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )

        if not jira_docs:
            return {
                "id": self.CONNECTOR_ID,
                "name": self.CONNECTOR_NAME,
                "type": self.CONNECTOR_TYPE,
                "sources": [],
            }, []

        def _title_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            issue_key = metadata.get("issue_key", "")
            issue_title = metadata.get("issue_title", "Untitled Issue")
            status = metadata.get("status", "")
            title = (
                f"Jira: {issue_key} - {issue_title}"
                if issue_key
                else f"Jira: {issue_title}"
            )
            if status:
                title += f" ({status})"
            return title

        def _url_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            issue_key = metadata.get("issue_key", "")
            base_url = metadata.get("base_url")
            return f"{base_url}/browse/{issue_key}" if issue_key and base_url else ""

        def _description_fn(
            chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> str:
            description = chunk.get("content", "")
            info_parts = []
            priority = metadata.get("priority", "")
            issue_type = metadata.get("issue_type", "")
            comment_count = metadata.get("comment_count", 0)
            if priority:
                info_parts.append(f"Priority: {priority}")
            if issue_type:
                info_parts.append(f"Type: {issue_type}")
            if comment_count:
                info_parts.append(f"Comments: {comment_count}")
            if info_parts:
                description = (description + " | " + " | ".join(info_parts)).strip(" |")
            return description

        def _extra_fields_fn(
            _chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> dict[str, Any]:
            return {
                "issue_key": metadata.get("issue_key", ""),
                "status": metadata.get("status", ""),
                "priority": metadata.get("priority", ""),
                "issue_type": metadata.get("issue_type", ""),
                "comment_count": metadata.get("comment_count", 0),
            }

        sources_list = self._build_chunk_sources_from_documents(
            jira_docs,
            title_fn=_title_fn,
            url_fn=_url_fn,
            description_fn=_description_fn,
            extra_fields_fn=_extra_fields_fn,
        )

        return {
            "id": self.CONNECTOR_ID,
            "name": self.CONNECTOR_NAME,
            "type": self.CONNECTOR_TYPE,
            "sources": sources_list,
        }, jira_docs
