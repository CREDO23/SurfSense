"""
Docling ETL service file processor.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Document

from ..base_file_processor import BaseFileProcessor


class DoclingFileProcessor(BaseFileProcessor):
    """File processor using Docling ETL service."""

    def _get_etl_service_name(self) -> str:
        return "DOCLING"

    def _get_document_metadata(self, file_name: str) -> dict:
        return {
            "file_name": file_name,
            "etl_service": "DOCLING",
            "document_type": "File Document",
        }


async def add_received_file_document_using_docling(
    session: AsyncSession,
    file_name: str,
    docling_markdown_document: str,
    search_space_id: int,
    user_id: str,
) -> Document | None:
    """
    Process and store document content parsed by Docling.

    Args:
        session: Database session
        file_name: Name of the processed file
        docling_markdown_document: Markdown content from Docling parsing
        search_space_id: ID of the search space
        user_id: ID of the user

    Returns:
        Document object if successful, None if failed
    """
    # Use the processor to handle the document
    processor = DoclingFileProcessor(session, user_id, search_space_id)
    return await processor.process_document(file_name, docling_markdown_document)
