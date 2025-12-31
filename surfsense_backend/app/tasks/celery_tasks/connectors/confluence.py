"""Connector indexing task."""

from app.celery_app import celery_app
from app.tasks.celery_tasks.connectors.base_connector_task import BaseConnectorTask


class ConfluenceIndexer(BaseConnectorTask):
    """Connector indexer."""

    async def index_connector(
        self, session, connector_id, search_space_id, user_id, start_date, end_date
    ):
        from app.routes.connectors.confluence import run_confluence_indexing

        await run_confluence_indexing(
            session, connector_id, search_space_id, user_id, start_date, end_date
        )


@celery_app.task(name="index_confluence_pages", bind=True)
def index_confluence_pages_task(
    self, connector_id, search_space_id, user_id, start_date, end_date
):
    """Celery task."""
    ConfluenceIndexer().execute(
        connector_id, search_space_id, user_id, start_date, end_date
    )
