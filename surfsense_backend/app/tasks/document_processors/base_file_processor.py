"""
Base file processor with template method pattern.
Eliminates code duplication across ETL service implementations.
"""

import logging
from abc import ABC, abstractmethod

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Document, DocumentType
from app.services.llm_service import get_user_long_context_llm
from app.utils.document_converters import (
    create_document_chunks,
    generate_content_hash,
    generate_unique_identifier_hash,
)

from .base import check_document_by_unique_identifier, get_current_timestamp

logger = logging.getLogger(__name__)


class BaseFileProcessor(ABC):
    """
    Base class for all file processing strategies.
    Uses Template Method pattern to eliminate 90% code duplication.
    """

    def __init__(
        self,
        session: AsyncSession,
        user_id: str,
        search_space_id: int,
    ):
        self.session = session
        self.user_id = user_id
        self.search_space_id = search_space_id
        self.user_llm = None

    async def process_document(
        self, file_name: str, markdown_content: str
    ) -> Document | None:
        """
        Template method - defines the processing workflow.
        Subclasses override _get_etl_service_name() and _get_document_metadata().
        """
        try:
            # Step 1: Generate hashes
            unique_identifier_hash = generate_unique_identifier_hash(
                DocumentType.FILE, file_name, self.search_space_id
            )
            content_hash = generate_content_hash(
                markdown_content, self.search_space_id
            )

            # Step 2: Check for existing document
            existing_document = await check_document_by_unique_identifier(
                self.session, unique_identifier_hash
            )

            if existing_document:
                # Document exists - check if content has changed
                if existing_document.content_hash == content_hash:
                    logger.info(f"Document for file {file_name} unchanged. Skipping.")
                    return existing_document
                else:
                    logger.info(
                        f"Content changed for file {file_name}. Updating document."
                    )

            # Step 3: Get user's LLM (needed for both create and update)
            self.user_llm = await get_user_long_context_llm(
                self.session, self.user_id, self.search_space_id
            )
            if not self.user_llm:
                raise RuntimeError(
                    f"No long context LLM configured for user {self.user_id} "
                    f"in search space {self.search_space_id}"
                )

            # Step 4: Generate summary (subclass-specific metadata)
            summary_content, summary_embedding = await self._generate_summary(
                file_name, markdown_content
            )

            # Step 5: Process chunks
            chunks = await create_document_chunks(markdown_content)

            # Step 6: Convert to BlockNote
            blocknote_json = await self._convert_to_blocknote(markdown_content)
            if not blocknote_json:
                logger.warning(
                    f"Failed to convert {file_name} to BlockNote JSON, "
                    "document will not be editable"
                )

            # Step 7: Save document (update or create)
            document = await self._save_document(
                existing_document=existing_document,
                file_name=file_name,
                summary_content=summary_content,
                summary_embedding=summary_embedding,
                chunks=chunks,
                content_hash=content_hash,
                unique_identifier_hash=unique_identifier_hash,
                blocknote_json=blocknote_json,
            )

            return document

        except SQLAlchemyError as db_error:
            await self.session.rollback()
            raise db_error
        except Exception as e:
            await self.session.rollback()
            raise RuntimeError(f"Failed to process file document: {e!s}") from e

    @abstractmethod
    def _get_etl_service_name(self) -> str:
        """Return the ETL service name (e.g., 'UNSTRUCTURED', 'LLAMACLOUD')."""
        pass

    @abstractmethod
    def _get_document_metadata(self, file_name: str) -> dict:
        """Return document metadata specific to the ETL service."""
        pass

    async def _generate_summary(
        self, file_name: str, markdown_content: str
    ) -> tuple[str, list[float]]:
        """
        Generate summary using subclass-specific metadata.
        Returns (summary_content, summary_embedding).
        """
        from app.utils.document_converters import generate_document_summary

        document_metadata = self._get_document_metadata(file_name)
        return await generate_document_summary(
            markdown_content, self.user_llm, document_metadata
        )

    async def _convert_to_blocknote(self, markdown_content: str) -> dict | None:
        """Convert markdown to BlockNote JSON format."""
        from app.utils.blocknote_converter import convert_markdown_to_blocknote

        return await convert_markdown_to_blocknote(markdown_content)

    async def _save_document(
        self,
        existing_document: Document | None,
        file_name: str,
        summary_content: str,
        summary_embedding: list[float],
        chunks: list[dict],
        content_hash: str,
        unique_identifier_hash: str,
        blocknote_json: dict | None,
    ) -> Document:
        """
        Save document (update existing or create new).
        Returns the saved Document object.
        """
        etl_service = self._get_etl_service_name()
        metadata = {"FILE_NAME": file_name, "ETL_SERVICE": etl_service}

        if existing_document:
            # Update existing document
            existing_document.title = file_name
            existing_document.content = summary_content
            existing_document.content_hash = content_hash
            existing_document.embedding = summary_embedding
            existing_document.document_metadata = metadata
            existing_document.chunks = chunks
            existing_document.blocknote_document = blocknote_json
            existing_document.content_needs_reindexing = False
            existing_document.updated_at = get_current_timestamp()

            await self.session.commit()
            await self.session.refresh(existing_document)
            return existing_document
        else:
            # Create new document
            document = Document(
                search_space_id=self.search_space_id,
                title=file_name,
                document_type=DocumentType.FILE,
                document_metadata=metadata,
                content=summary_content,
                embedding=summary_embedding,
                chunks=chunks,
                content_hash=content_hash,
                unique_identifier_hash=unique_identifier_hash,
                blocknote_document=blocknote_json,
                content_needs_reindexing=False,
                updated_at=get_current_timestamp(),
            )

            self.session.add(document)
            await self.session.commit()
            await self.session.refresh(document)
            return document
