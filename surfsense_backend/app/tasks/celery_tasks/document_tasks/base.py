"""Base class for document processing Celery tasks using Template Method pattern."""

import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.celery_app import celery_app
from app.services.task_logging_service import TaskLoggingService

logger = logging.getLogger(__name__)


class BaseDocumentTask(ABC):
    """
    Base class for document processing Celery tasks.
    
    Uses Template Method pattern to eliminate duplication in:
    - Event loop management
    - Session handling
    - Task logging (start/success/failure)
    - Exception handling
    
    Subclasses must implement:
    - task_name: str - Celery task name
    - source_type: str - Source type for logging (e.g., 'document_processor')
    - process() - Core processing logic
    - get_log_metadata() - Initial metadata for logging
    - get_log_message() - Start message for logging
    """

    @property
    @abstractmethod
    def task_name(self) -> str:
        """Celery task name (e.g., 'process_extension_document')."""
        pass

    @property
    @abstractmethod
    def source_type(self) -> str:
        """Source type for logging (e.g., 'document_processor')."""
        pass

    @abstractmethod
    async def process(
        self, session: AsyncSession, search_space_id: int, user_id: str, **kwargs
    ) -> Any:
        """
        Core processing logic. Must be implemented by subclasses.
        
        Returns:
            Processing result (Document object or None for duplicates)
        """
        pass

    @abstractmethod
    def get_log_metadata(self, **kwargs) -> dict:
        """Get initial metadata for task logging."""
        pass

    @abstractmethod
    def get_log_message(self, **kwargs) -> str:
        """Get start message for task logging."""
        pass

    def get_success_message(self, result: Any, **kwargs) -> str:
        """Get success message. Override for custom formatting."""
        return f"Successfully processed document"

    def get_success_metadata(self, result: Any, **kwargs) -> dict:
        """Get success metadata. Override for custom formatting."""
        if result:
            return {"document_id": result.id, "content_hash": result.content_hash}
        return {"duplicate_detected": True}

    def get_duplicate_message(self, **kwargs) -> str:
        """Get duplicate message. Override for custom formatting."""
        return "Document already exists (duplicate)"

    def get_failure_message(self, **kwargs) -> str:
        """Get failure message. Override for custom formatting."""
        return "Failed to process document"

    def handle_exception(self, e: Exception, **kwargs) -> tuple[str, bool]:
        """
        Handle exception. Override for custom error handling.
        
        Returns:
            (error_message, should_raise)
        """
        return (self.get_failure_message(**kwargs), True)

    async def execute(
        self,
        session_maker,
        search_space_id: int,
        user_id: str,
        **kwargs,
    ):
        """
        Template method orchestrating the task execution.
        
        This method handles:
        - Session management
        - Task logging (start/success/failure)
        - Exception handling
        """
        async with session_maker() as session:
            task_logger = TaskLoggingService(session, search_space_id)

            # Log task start
            log_entry = await task_logger.log_task_start(
                task_name=self.task_name,
                source=self.source_type,
                message=self.get_log_message(**kwargs),
                metadata=self.get_log_metadata(user_id=user_id, **kwargs),
            )

            try:
                # Execute core processing logic
                result = await self.process(
                    session, search_space_id, user_id, **kwargs
                )

                # Log success
                if result:
                    await task_logger.log_task_success(
                        log_entry,
                        self.get_success_message(result, **kwargs),
                        self.get_success_metadata(result, **kwargs),
                    )
                else:
                    # Duplicate detected
                    await task_logger.log_task_success(
                        log_entry,
                        self.get_duplicate_message(**kwargs),
                        {"duplicate_detected": True},
                    )

            except Exception as e:
                # Handle exception
                error_message, should_raise = self.handle_exception(e, **kwargs)

                await task_logger.log_task_failure(
                    log_entry,
                    error_message,
                    str(e),
                    {"error_type": type(e).__name__},
                )
                logger.error(f"{error_message}: {e!s}")

                if should_raise:
                    raise

    def create_celery_task(self, bind=True):
        """
        Create Celery task wrapper with event loop management.
        
        This method wraps the async execute() method with:
        - New event loop creation
        - Event loop cleanup
        - Celery task decorator
        """

        def task_wrapper(self_celery, *args, **kwargs):
            """Celery task wrapper with event loop management."""
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            try:
                from app.tasks.celery_tasks.document_tasks import (
                    get_celery_session_maker,
                )

                session_maker = get_celery_session_maker()
                loop.run_until_complete(self.execute(session_maker, *args, **kwargs))
            finally:
                loop.close()

        return celery_app.task(name=self.task_name, bind=bind)(task_wrapper)
