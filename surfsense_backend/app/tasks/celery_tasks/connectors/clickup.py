"""Connector indexing task."""

from app.celery_app import celery_app
from app.tasks.celery_tasks.connectors.base_connector_task import BaseConnectorTask


class ClickupIndexer(BaseConnectorTask):
    """Connector indexer."""

    async def index_connector(
        self, session, connector_id, search_space_id, user_id, start_date, end_date
    ):
        from app.routes.connectors.clickup import run_clickup_indexing

        await run_clickup_indexing(
            session, connector_id, search_space_id, user_id, start_date, end_date
        )


@celery_app.task(name="index_clickup_tasks", bind=True)
def index_clickup_tasks_task(
    self, connector_id, search_space_id, user_id, start_date, end_date
):
    """Celery task."""
    ClickupIndexer().execute(
        connector_id, search_space_id, user_id, start_date, end_date
    )
