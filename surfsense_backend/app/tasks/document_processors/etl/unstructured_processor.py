"""
Unstructured ETL service file processor.
"""

from langchain_core.documents import Document as LangChainDocument
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Document
from app.utils.document_converters import convert_document_to_markdown

from ..base_file_processor import BaseFileProcessor


class UnstructuredFileProcessor(BaseFileProcessor):
    """File processor using Unstructured ETL service."""

    def _get_etl_service_name(self) -> str:
        return "UNSTRUCTURED"

    def _get_document_metadata(self, file_name: str) -> dict:
        return {
            "file_name": file_name,
            "etl_service": "UNSTRUCTURED",
            "document_type": "File Document",
        }


async def add_received_file_document_using_unstructured(
    session: AsyncSession,
    file_name: str,
    unstructured_processed_elements: list[LangChainDocument],
    search_space_id: int,
    user_id: str,
) -> Document | None:
    """
    Process and store a file document using Unstructured service.

    Args:
        session: Database session
        file_name: Name of the processed file
        unstructured_processed_elements: Processed elements from Unstructured
        search_space_id: ID of the search space
        user_id: ID of the user

    Returns:
        Document object if successful, None if failed
    """
    # Convert unstructured elements to markdown
    file_in_markdown = await convert_document_to_markdown(
        unstructured_processed_elements
    )

    # Use the processor to handle the document
    processor = UnstructuredFileProcessor(session, user_id, search_space_id)
    return await processor.process_document(file_name, file_in_markdown)
