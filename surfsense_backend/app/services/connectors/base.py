"""Base connector service with shared functionality."""

import asyncio
import logging
from datetime import datetime
from typing import Any

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import Chunk, Document
from app.retriever.chunks_hybrid_search import ChucksHybridSearchRetriever
from app.retriever.documents_hybrid_search import DocumentHybridSearchRetriever

logger = logging.getLogger(__name__)


class BaseConnectorService:
    """Base service with shared search and utility methods for all connectors."""

    def __init__(self, session: AsyncSession, search_space_id: int | None = None):
        self.session = session
        self.chunk_retriever = ChucksHybridSearchRetriever(session)
        self.document_retriever = DocumentHybridSearchRetriever(session)
        self.search_space_id = search_space_id
        self.source_id_counter = 100000
        self.counter_lock = asyncio.Lock()

    async def initialize_counter(self):
        """Initialize the source_id_counter based on total chunks."""
        if self.search_space_id:
            try:
                result = await self.session.execute(
                    select(func.count(Chunk.id))
                    .join(Document)
                    .filter(Document.search_space_id == self.search_space_id)
                )
                chunk_count = result.scalar() or 0
                self.source_id_counter = chunk_count + 1
            except Exception as e:
                logger.error(f"Error initializing source_id_counter: {e!s}")
                self.source_id_counter = 1

    async def _combined_rrf_search(
        self,
        query_text: str,
        search_space_id: int,
        document_type: str,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[dict[str, Any]]:
        """Perform combined search using chunk and document hybrid search with RRF fusion."""
        k = 60
        retriever_top_k = top_k * 2

        chunk_results = await self.chunk_retriever.hybrid_search(
            query_text=query_text,
            top_k=retriever_top_k,
            search_space_id=search_space_id,
            document_type=document_type,
            start_date=start_date,
            end_date=end_date,
        )
        doc_results = await self.document_retriever.hybrid_search(
            query_text=query_text,
            top_k=retriever_top_k,
            search_space_id=search_space_id,
            document_type=document_type,
            start_date=start_date,
            end_date=end_date,
        )

        def _doc_id(item: dict[str, Any]) -> int | None:
            doc = item.get("document", {})
            did = doc.get("id")
            return int(did) if did is not None else None

        chunk_ranks: dict[int, int] = {}
        for rank, result in enumerate(chunk_results, start=1):
            did = _doc_id(result)
            if did is not None and did not in chunk_ranks:
                chunk_ranks[did] = rank

        doc_ranks: dict[int, int] = {}
        for rank, result in enumerate(doc_results, start=1):
            did = _doc_id(result)
            if did is not None and did not in doc_ranks:
                doc_ranks[did] = rank

        all_doc_ids = set(chunk_ranks.keys()) | set(doc_ranks.keys())

        rrf_scores: dict[int, float] = {}
        for did in all_doc_ids:
            chunk_rank = chunk_ranks.get(did)
            doc_rank = doc_ranks.get(did)
            score = 0.0
            if chunk_rank is not None:
                score += 1.0 / (k + chunk_rank)
            if doc_rank is not None:
                score += 1.0 / (k + doc_rank)
            rrf_scores[did] = score

        doc_data: dict[int, dict[str, Any]] = {}
        for result in chunk_results:
            did = _doc_id(result)
            if did is not None and did not in doc_data:
                doc_data[did] = result
        for result in doc_results:
            did = _doc_id(result)
            if did is not None and did not in doc_data:
                doc_data[did] = result

        sorted_doc_ids = sorted(
            all_doc_ids, key=lambda did: rrf_scores[did], reverse=True
        )[:top_k]

        combined_results: list[dict[str, Any]] = []
        for did in sorted_doc_ids:
            if did in doc_data:
                result = doc_data[did].copy()
                result["document_id"] = did
                result["score"] = rrf_scores[did]
                if "chunks" in doc_data[did]:
                    result["chunks"] = doc_data[did]["chunks"]
                combined_results.append(result)

        return combined_results

    def _get_doc_url(self, metadata: dict[str, Any]) -> str:
        """Extract document URL from metadata."""
        return (
            metadata.get("url")
            or metadata.get("source")
            or metadata.get("page_url")
            or metadata.get("VisitedWebPageURL")
            or ""
        )

    def _chunk_preview(self, text: str, limit: int = 200) -> str:
        """Create a preview of chunk text."""
        if not text:
            return ""
        text = str(text)
        if len(text) <= limit:
            return text
        return text[:limit] + "..."

    def _build_chunk_sources_from_documents(
        self,
        documents: list[dict[str, Any]],
        *,
        title_fn=None,
        description_fn=None,
        url_fn=None,
        extra_fields_fn=None,
    ) -> list[dict[str, Any]]:
        """Build chunk-level sources list from document-grouped results."""
        sources: list[dict[str, Any]] = []

        for doc in documents:
            doc_info = doc.get("document", {}) or {}
            metadata = doc_info.get("metadata", {}) or {}
            url = url_fn(doc_info, metadata) if url_fn else self._get_doc_url(metadata)
            chunks = doc.get("chunks", []) or []
            display_title = (
                title_fn(doc_info, metadata)
                if title_fn
                else doc_info.get("title", "Untitled Document")
            )
            for chunk in chunks:
                chunk_id = chunk.get("chunk_id")
                chunk_content = chunk.get("content", "")
                description = (
                    description_fn(chunk, doc_info, metadata)
                    if description_fn
                    else self._chunk_preview(chunk_content)
                )
                source = {
                    "id": chunk_id,
                    "title": display_title,
                    "description": description,
                    "url": url,
                }
                if extra_fields_fn:
                    source.update(extra_fields_fn(chunk, doc_info, metadata) or {})
                sources.append(source)
        return sources
