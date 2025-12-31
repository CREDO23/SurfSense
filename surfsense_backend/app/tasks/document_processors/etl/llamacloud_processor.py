"""
LlamaCloud ETL service file processor.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Document

from ..base_file_processor import BaseFileProcessor


class LlamaCloudFileProcessor(BaseFileProcessor):
    """File processor using LlamaCloud ETL service."""

    def _get_etl_service_name(self) -> str:
        return "LLAMACLOUD"

    def _get_document_metadata(self, file_name: str) -> dict:
        return {
            "file_name": file_name,
            "etl_service": "LLAMACLOUD",
            "document_type": "File Document",
        }


async def add_received_file_document_using_llamacloud(
    session: AsyncSession,
    file_name: str,
    llamacloud_markdown_document: str,
    search_space_id: int,
    user_id: str,
) -> Document | None:
    """
    Process and store document content parsed by LlamaCloud.

    Args:
        session: Database session
        file_name: Name of the processed file
        llamacloud_markdown_document: Markdown content from LlamaCloud parsing
        search_space_id: ID of the search space
        user_id: ID of the user

    Returns:
        Document object if successful, None if failed
    """
    # Use the processor to handle the document
    processor = LlamaCloudFileProcessor(session, user_id, search_space_id)
    return await processor.process_document(file_name, llamacloud_markdown_document)
