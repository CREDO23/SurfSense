"""Connector indexing task."""

from app.celery_app import celery_app
from app.tasks.celery_tasks.connectors.base_connector_task import BaseConnectorTask


class LumaIndexer(BaseConnectorTask):
    """Connector indexer."""

    async def index_connector(
        self, session, connector_id, search_space_id, user_id, start_date, end_date
    ):
        from app.routes.connectors.luma import run_luma_indexing

        await run_luma_indexing(
            session, connector_id, search_space_id, user_id, start_date, end_date
        )


@celery_app.task(name="index_luma_events", bind=True)
def index_luma_events_task(
    self, connector_id, search_space_id, user_id, start_date, end_date
):
    """Celery task."""
    LumaIndexer().execute(
        connector_id, search_space_id, user_id, start_date, end_date
    )
