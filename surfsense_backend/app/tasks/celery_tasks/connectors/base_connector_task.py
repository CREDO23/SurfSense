"""Base class for connector indexing tasks using Template Method pattern."""

import asyncio
import logging
from abc import ABC, abstractmethod

from sqlalchemy.ext.asyncio import async_sessionmaker

logger = logging.getLogger(__name__)


class BaseConnectorTask(ABC):
    """Base class for connector indexing tasks.

    This uses the Template Method pattern to eliminate duplication across
    15 connector tasks that all follow the same structure:
    1. Create new event loop
    2. Run async indexing function
    3. Close event loop
    """

    def execute(
        self,
        connector_id: int,
        search_space_id: int,
        user_id: str,
        start_date: str,
        end_date: str,
    ):
        """Template method - defines the algorithm skeleton."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            loop.run_until_complete(
                self._run_indexing(
                    connector_id, search_space_id, user_id, start_date, end_date
                )
            )
        finally:
            loop.close()

    async def _run_indexing(
        self,
        connector_id: int,
        search_space_id: int,
        user_id: str,
        start_date: str,
        end_date: str,
    ):
        """Run the indexing function with a new session."""
        from app.config import config
        from sqlalchemy.ext.asyncio import create_async_engine
        from sqlalchemy.pool import NullPool

        # Create session maker for this task
        engine = create_async_engine(
            config.DATABASE_URL,
            poolclass=NullPool,  # Don't use connection pooling for Celery tasks
            echo=False,
        )
        session_maker = async_sessionmaker(engine, expire_on_commit=False)

        async with session_maker() as session:
            await self.index_connector(
                session, connector_id, search_space_id, user_id, start_date, end_date
            )

    @abstractmethod
    async def index_connector(
        self,
        session,
        connector_id: int,
        search_space_id: int,
        user_id: str,
        start_date: str,
        end_date: str,
    ):
        """Subclass-specific indexing logic.

        Each connector implements this method to call their specific
        run_XXX_indexing() function.
        """
        pass
