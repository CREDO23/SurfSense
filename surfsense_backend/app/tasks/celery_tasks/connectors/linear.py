"""Connector indexing task."""

from app.celery_app import celery_app
from app.tasks.celery_tasks.connectors.base_connector_task import BaseConnectorTask


class LinearIndexer(BaseConnectorTask):
    """Connector indexer."""

    async def index_connector(
        self, session, connector_id, search_space_id, user_id, start_date, end_date
    ):
        from app.routes.connectors.linear import run_linear_indexing

        await run_linear_indexing(
            session, connector_id, search_space_id, user_id, start_date, end_date
        )


@celery_app.task(name="index_linear_issues", bind=True)
def index_linear_issues_task(
    self, connector_id, search_space_id, user_id, start_date, end_date
):
    """Celery task."""
    LinearIndexer().execute(
        connector_id, search_space_id, user_id, start_date, end_date
    )
