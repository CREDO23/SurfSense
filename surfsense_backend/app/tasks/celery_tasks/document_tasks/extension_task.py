"""Extension document processing task."""

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.tasks.celery_tasks.document_tasks.base import BaseDocumentTask
from app.tasks.document_processors import add_extension_received_document


class DocumentMetadata(BaseModel):
    """Extension document metadata."""

    VisitedWebPageTitle: str
    VisitedWebPageURL: str
    BrowsingSessionId: str
    VisitedWebPageDateWithTimeInISOString: str
    VisitedWebPageReffererURL: str
    VisitedWebPageVisitDurationInMilliseconds: str


class IndividualDocument(BaseModel):
    """Extension individual document model."""

    model_config = ConfigDict(populate_by_name=True)
    metadata: DocumentMetadata
    page_content: str = Field(alias="pageContent")


class ExtensionDocumentTask(BaseDocumentTask):
    """Task for processing extension-received documents."""

    @property
    def task_name(self) -> str:
        return "process_extension_document"

    @property
    def source_type(self) -> str:
        return "document_processor"

    async def process(
        self,
        session: AsyncSession,
        search_space_id: int,
        user_id: str,
        individual_document_dict: dict,
    ):
        """Process extension document."""
        # Reconstruct document from dict
        individual_document = IndividualDocument(**individual_document_dict)

        # Add document to database
        return await add_extension_received_document(
            session, individual_document, search_space_id, user_id
        )

    def get_log_metadata(self, individual_document_dict: dict, user_id: str) -> dict:
        """Get initial logging metadata."""
        doc = IndividualDocument(**individual_document_dict)
        return {
            "document_type": "EXTENSION",
            "url": doc.metadata.VisitedWebPageURL,
            "title": doc.metadata.VisitedWebPageTitle,
            "user_id": user_id,
        }

    def get_log_message(self, individual_document_dict: dict) -> str:
        """Get start log message."""
        doc = IndividualDocument(**individual_document_dict)
        return f"Starting processing of extension document from {doc.metadata.VisitedWebPageTitle}"

    def get_success_message(self, result, individual_document_dict: dict) -> str:
        """Get success message."""
        doc = IndividualDocument(**individual_document_dict)
        return f"Successfully processed extension document: {doc.metadata.VisitedWebPageTitle}"

    def get_duplicate_message(self, individual_document_dict: dict) -> str:
        """Get duplicate message."""
        doc = IndividualDocument(**individual_document_dict)
        return f"Extension document already exists (duplicate): {doc.metadata.VisitedWebPageTitle}"

    def get_failure_message(self, individual_document_dict: dict) -> str:
        """Get failure message."""
        doc = IndividualDocument(**individual_document_dict)
        return f"Failed to process extension document: {doc.metadata.VisitedWebPageTitle}"


# Create task instance
extension_task = ExtensionDocumentTask()

# Create Celery task
process_extension_document_task = extension_task.create_celery_task()
