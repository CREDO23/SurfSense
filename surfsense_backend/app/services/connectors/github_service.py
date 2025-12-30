"""GitHub connector service."""

from datetime import datetime

from app.services.connectors.base import BaseConnectorService


class GitHubConnectorService(BaseConnectorService):
    """Service for searching GitHub documents."""

    CONNECTOR_ID = 8
    CONNECTOR_NAME = "GitHub"
    CONNECTOR_TYPE = "GITHUB_CONNECTOR"

    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search for GitHub documents.

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
        github_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=search_space_id,
            document_type=self.CONNECTOR_TYPE,
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )

        if not github_docs:
            return {
                "id": self.CONNECTOR_ID,
                "name": self.CONNECTOR_NAME,
                "type": self.CONNECTOR_TYPE,
                "sources": [],
            }, []

        sources_list = self._build_chunk_sources_from_documents(
            github_docs,
            description_fn=lambda chunk, _doc_info, metadata: metadata.get(
                "description"
            )
            or chunk.get("content", ""),
            url_fn=lambda _doc_info, metadata: metadata.get("url", "") or "",
        )

        result_object = {
            "id": self.CONNECTOR_ID,
            "name": self.CONNECTOR_NAME,
            "type": self.CONNECTOR_TYPE,
            "sources": sources_list,
        }

        return result_object, github_docs
