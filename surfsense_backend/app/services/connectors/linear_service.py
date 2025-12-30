from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class LinearConnectorService(BaseConnectorService):
    """Service for searching Linear issues and comments."""

    CONNECTOR_ID = 9
    CONNECTOR_NAME = "Linear Issues"
    CONNECTOR_TYPE = "LINEAR_CONNECTOR"

    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """
        Search for Linear issues and comments and return both the source information and langchain documents.

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
        linear_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=search_space_id,
            document_type=self.CONNECTOR_TYPE,
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )

        # Early return if no results
        if not linear_docs:
            return {
                "id": self.CONNECTOR_ID,
                "name": self.CONNECTOR_NAME,
                "type": self.CONNECTOR_TYPE,
                "sources": [],
            }, []

        def _title_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            issue_identifier = metadata.get("issue_identifier", "")
            issue_title = metadata.get("issue_title", "Untitled Issue")
            issue_state = metadata.get("state", "")
            title = (
                f"Linear: {issue_identifier} - {issue_title}"
                if issue_identifier
                else f"Linear: {issue_title}"
            )
            if issue_state:
                title += f" ({issue_state})"
            return title

        def _url_fn(_doc_info: dict[str, Any], metadata: dict[str, Any]) -> str:
            issue_identifier = metadata.get("issue_identifier", "")
            return (
                f"https://linear.app/issue/{issue_identifier}"
                if issue_identifier
                else ""
            )

        def _description_fn(
            chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> str:
            description = chunk.get("content", "")
            comment_count = metadata.get("comment_count", 0)
            if comment_count:
                description = (description + f" | Comments: {comment_count}").strip(
                    " |"
                )
            return description

        def _extra_fields_fn(
            _chunk: dict[str, Any], _doc_info: dict[str, Any], metadata: dict[str, Any]
        ) -> dict[str, Any]:
            return {
                "issue_identifier": metadata.get("issue_identifier", ""),
                "state": metadata.get("state", ""),
                "comment_count": metadata.get("comment_count", 0),
            }

        sources_list = self._build_chunk_sources_from_documents(
            linear_docs,
            title_fn=_title_fn,
            url_fn=_url_fn,
            description_fn=_description_fn,
            extra_fields_fn=_extra_fields_fn,
        )

        # Create result object
        result_object = {
            "id": self.CONNECTOR_ID,
            "name": self.CONNECTOR_NAME,
            "type": self.CONNECTOR_TYPE,
            "sources": sources_list,
        }

        return result_object, linear_docs
