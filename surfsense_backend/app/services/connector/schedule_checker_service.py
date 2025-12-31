"""Service for checking and triggering periodic connector indexing.

Extracts the schedule checking logic into a testable, reusable service.
"""

import logging
from datetime import UTC, datetime, timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import SearchSourceConnector, SearchSourceConnectorType

logger = logging.getLogger(__name__)


class ScheduleCheckerService:
    """Service for checking periodic indexing schedules and triggering tasks."""

    # Task mapping for connector types
    TASK_MAP = None  # Will be initialized lazily to avoid circular imports

    @classmethod
    def get_task_map(cls) -> dict:
        """Get task mapping for connector types.
        
        Uses lazy initialization to avoid circular import issues.
        
        Returns:
            Dict mapping connector types to their indexing tasks
        """
        if cls.TASK_MAP is None:
            # Lazy import to avoid circular dependencies
            from app.tasks.celery_tasks.connector_tasks import (
                index_airtable_records_task,
                index_clickup_tasks_task,
                index_confluence_pages_task,
                index_crawled_urls_task,
                index_discord_messages_task,
                index_elasticsearch_documents_task,
                index_github_repos_task,
                index_google_calendar_events_task,
                index_google_gmail_messages_task,
                index_jira_issues_task,
                index_linear_issues_task,
                index_luma_events_task,
                index_notion_pages_task,
                index_slack_messages_task,
            )

            cls.TASK_MAP = {
                SearchSourceConnectorType.SLACK_CONNECTOR: index_slack_messages_task,
                SearchSourceConnectorType.NOTION_CONNECTOR: index_notion_pages_task,
                SearchSourceConnectorType.GITHUB_CONNECTOR: index_github_repos_task,
                SearchSourceConnectorType.LINEAR_CONNECTOR: index_linear_issues_task,
                SearchSourceConnectorType.JIRA_CONNECTOR: index_jira_issues_task,
                SearchSourceConnectorType.CONFLUENCE_CONNECTOR: index_confluence_pages_task,
                SearchSourceConnectorType.CLICKUP_CONNECTOR: index_clickup_tasks_task,
                SearchSourceConnectorType.GOOGLE_CALENDAR_CONNECTOR: index_google_calendar_events_task,
                SearchSourceConnectorType.AIRTABLE_CONNECTOR: index_airtable_records_task,
                SearchSourceConnectorType.GOOGLE_GMAIL_CONNECTOR: index_google_gmail_messages_task,
                SearchSourceConnectorType.DISCORD_CONNECTOR: index_discord_messages_task,
                SearchSourceConnectorType.LUMA_CONNECTOR: index_luma_events_task,
                SearchSourceConnectorType.ELASTICSEARCH_CONNECTOR: index_elasticsearch_documents_task,
                SearchSourceConnectorType.WEBCRAWLER_CONNECTOR: index_crawled_urls_task,
            }
        
        return cls.TASK_MAP

    @staticmethod
    async def find_due_connectors(
        session: AsyncSession, now: Optional[datetime] = None
    ) -> list[SearchSourceConnector]:
        """Find all connectors that are due for periodic indexing.
        
        Args:
            session: Database session
            now: Current datetime (defaults to UTC now)
            
        Returns:
            List of SearchSourceConnector instances that are due for indexing
        """
        if now is None:
            now = datetime.now(UTC)
        
        result = await session.execute(
            select(SearchSourceConnector).filter(
                SearchSourceConnector.periodic_indexing_enabled == True,  # noqa: E712
                SearchSourceConnector.next_scheduled_at <= now,
            )
        )
        due_connectors = result.scalars().all()
        
        logger.debug(f"Found {len(due_connectors)} connectors due for indexing")
        return due_connectors

    @classmethod
    def trigger_indexing_task(
        cls,
        connector: SearchSourceConnector,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> bool:
        """Trigger the indexing task for a connector.
        
        Args:
            connector: The connector to index
            start_date: Optional start date for indexing (uses last_indexed_at if None)
            end_date: Optional end date for indexing (uses now if None)
            
        Returns:
            True if task was triggered, False if no task found for connector type
        """
        task_map = cls.get_task_map()
        task = task_map.get(connector.connector_type)
        
        if not task:
            logger.warning(
                f"No task found for connector type {connector.connector_type}"
            )
            return False
        
        logger.info(
            f"Triggering periodic indexing for connector {connector.id} "
            f"({connector.connector_type.value})"
        )
        
        task.delay(
            connector.id,
            connector.search_space_id,
            str(connector.user_id),
            start_date,
            end_date,
        )
        
        return True

    @staticmethod
    async def update_next_schedule(
        session: AsyncSession,
        connector: SearchSourceConnector,
        now: Optional[datetime] = None,
    ) -> None:
        """Update the next_scheduled_at time for a connector.
        
        Args:
            session: Database session
            connector: The connector to update
            now: Current datetime (defaults to UTC now)
        """
        if now is None:
            now = datetime.now(UTC)
        
        connector.next_scheduled_at = now + timedelta(
            minutes=connector.indexing_frequency_minutes
        )
        await session.commit()
        
        logger.debug(
            f"Updated next_scheduled_at for connector {connector.id} to "
            f"{connector.next_scheduled_at}"
        )

    @classmethod
    async def check_and_trigger_schedules(
        cls,
        session: AsyncSession,
        now: Optional[datetime] = None,
    ) -> int:
        """Check for due connectors and trigger their indexing tasks.
        
        This is the main entry point that orchestrates the schedule checking workflow.
        
        Args:
            session: Database session
            now: Current datetime (defaults to UTC now)
            
        Returns:
            Number of connectors that were triggered for indexing
            
        Raises:
            Exception: For errors during schedule checking
        """
        try:
            if now is None:
                now = datetime.now(UTC)
            
            # Step 1: Find all connectors due for indexing
            due_connectors = await cls.find_due_connectors(session, now)
            
            if not due_connectors:
                logger.debug("No connectors due for periodic indexing")
                return 0
            
            logger.info(f"Found {len(due_connectors)} connectors due for indexing")
            
            # Step 2: Trigger indexing for each due connector
            triggered_count = 0
            for connector in due_connectors:
                if cls.trigger_indexing_task(connector):
                    # Step 3: Update next_scheduled_at for successful triggers
                    await cls.update_next_schedule(session, connector, now)
                    triggered_count += 1
            
            logger.info(f"Triggered indexing for {triggered_count} connectors")
            return triggered_count

        except Exception as e:
            logger.error(f"Error checking periodic schedules: {e!s}", exc_info=True)
            await session.rollback()
            raise
