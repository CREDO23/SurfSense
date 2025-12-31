"""Notion connector indexing task."""

from app.celery_app import celery_app
from app.tasks.celery_tasks.connectors.base_connector_task import BaseConnectorTask


class NotionIndexer(BaseConnectorTask):
    """Notion pages indexer."""

    async def index_connector(
        self, session, connector_id, search_space_id, user_id, start_date, end_date
    ):
        from app.routes.connectors.notion import run_notion_indexing

        await run_notion_indexing(
            session, connector_id, search_space_id, user_id, start_date, end_date
        )


@celery_app.task(name="index_notion_pages", bind=True)
def index_notion_pages_task(
    self, connector_id, search_space_id, user_id, start_date, end_date
):
    """Celery task to index Notion pages."""
    NotionIndexer().execute(
        connector_id, search_space_id, user_id, start_date, end_date
    )
