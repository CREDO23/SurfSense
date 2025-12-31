"""Service for reindexing document content after editing.

Extracts the complex reindex workflow into testable, reusable methods.
"""

import logging
from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Chunk, Document
from app.services.llm_service import get_user_long_context_llm
from app.utils.blocknote_converter import convert_blocknote_to_markdown
from app.utils.document_converters import (
    create_document_chunks,
    generate_document_summary,
)

logger = logging.getLogger(__name__)


class DocumentReindexService:
    """Service for reindexing documents after content changes."""

    @staticmethod
    async def load_document(
        session: AsyncSession, document_id: int
    ) -> Optional[Document]:
        """Load document with chunks preloaded.
        
        Args:
            session: Database session
            document_id: ID of document to load
            
        Returns:
            Document instance or None if not found
        """
        result = await session.execute(
            select(Document)
            .options(selectinload(Document.chunks))
            .where(Document.id == document_id)
        )
        return result.scalars().first()

    @staticmethod
    async def convert_to_markdown(
        document: Document,
    ) -> Optional[str]:
        """Convert BlockNote document to Markdown.
        
        Args:
            document: Document with blocknote_document content
            
        Returns:
            Markdown string or None if conversion failed
        """
        if not document.blocknote_document:
            logger.warning(f"Document {document.id} has no BlockNote content")
            return None

        markdown_content = await convert_blocknote_to_markdown(
            document.blocknote_document
        )
        
        if not markdown_content:
            logger.error(f"Failed to convert document {document.id} to markdown")
            return None
            
        return markdown_content

    @staticmethod
    async def delete_old_chunks(session: AsyncSession, document_id: int) -> None:
        """Delete all existing chunks for a document.
        
        Args:
            session: Database session
            document_id: ID of document whose chunks to delete
        """
        await session.execute(delete(Chunk).where(Chunk.document_id == document_id))
        await session.flush()  # Ensure old chunks are deleted before creating new ones
        logger.info(f"Deleted old chunks for document {document_id}")

    @staticmethod
    async def create_chunks(
        session: AsyncSession, markdown_content: str, document_id: int
    ) -> list[Chunk]:
        """Create new chunks from markdown content.
        
        Args:
            session: Database session
            markdown_content: Markdown text to chunk
            document_id: ID of document to associate chunks with
            
        Returns:
            List of created Chunk instances
        """
        new_chunks = await create_document_chunks(markdown_content)
        
        # Associate chunks with document and add to session
        for chunk in new_chunks:
            chunk.document_id = document_id
            session.add(chunk)
        
        logger.info(f"Created {len(new_chunks)} chunks for document {document_id}")
        return new_chunks

    @staticmethod
    async def regenerate_summary(
        session: AsyncSession,
        document: Document,
        markdown_content: str,
        user_id: str,
    ) -> tuple[str, list[float]]:
        """Regenerate document summary and embedding using LLM.
        
        Args:
            session: Database session
            document: Document to regenerate summary for
            markdown_content: Full markdown content
            user_id: User ID for LLM config
            
        Returns:
            Tuple of (summary_content, summary_embedding)
        """
        user_llm = await get_user_long_context_llm(
            session, user_id, document.search_space_id
        )

        document_metadata = {
            "title": document.title,
            "document_type": document.document_type.value,
        }

        summary_content, summary_embedding = await generate_document_summary(
            markdown_content, user_llm, document_metadata
        )
        
        logger.info(f"Regenerated summary for document {document.id}")
        return summary_content, summary_embedding

    @staticmethod
    def update_document(
        document: Document, summary_content: str, summary_embedding: list[float]
    ) -> None:
        """Update document with new summary and embedding.
        
        Args:
            document: Document to update
            summary_content: New summary text
            summary_embedding: New embedding vector
        """
        document.content = summary_content
        document.embedding = summary_embedding
        document.content_needs_reindexing = False
        logger.info(f"Updated document {document.id} with new summary")

    @classmethod
    async def reindex_document(
        cls,
        session: AsyncSession,
        document_id: int,
        user_id: str,
    ) -> dict:
        """Complete reindex workflow for a document.
        
        This is the main entry point that orchestrates all steps.
        
        Args:
            session: Database session
            document_id: ID of document to reindex
            user_id: User ID for LLM config
            
        Returns:
            Dict with reindex results: {"chunks_created": int, "document_id": int}
            
        Raises:
            ValueError: If document not found or has no BlockNote content
            Exception: For other errors during reindex
        """
        # Step 1: Load document
        document = await cls.load_document(session, document_id)
        if not document:
            raise ValueError(f"Document {document_id} not found")

        logger.info(f"Reindexing document {document_id} ({document.title})")

        # Step 2: Convert to markdown
        markdown_content = await cls.convert_to_markdown(document)
        if not markdown_content:
            raise ValueError(
                f"Document {document_id} has no BlockNote content or conversion failed"
            )

        # Step 3: Delete old chunks
        await cls.delete_old_chunks(session, document_id)

        # Step 4: Create new chunks
        new_chunks = await cls.create_chunks(session, markdown_content, document_id)

        # Step 5: Regenerate summary
        summary_content, summary_embedding = await cls.regenerate_summary(
            session, document, markdown_content, user_id
        )

        # Step 6: Update document
        cls.update_document(document, summary_content, summary_embedding)

        # Commit happens in caller
        logger.info(f"Successfully reindexed document {document_id}")

        return {
            "chunks_created": len(new_chunks),
            "document_id": document_id,
        }
