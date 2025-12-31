"""Connector indexing task."""

from app.celery_app import celery_app
from app.tasks.celery_tasks.connectors.base_connector_task import BaseConnectorTask


class AirtableIndexer(BaseConnectorTask):
    """Connector indexer."""

    async def index_connector(
        self, session, connector_id, search_space_id, user_id, start_date, end_date
    ):
        from app.routes.connectors.airtable import run_airtable_indexing

        await run_airtable_indexing(
            session, connector_id, search_space_id, user_id, start_date, end_date
        )


@celery_app.task(name="index_airtable_records", bind=True)
def index_airtable_records_task(
    self, connector_id, search_space_id, user_id, start_date, end_date
):
    """Celery task."""
    AirtableIndexer().execute(
        connector_id, search_space_id, user_id, start_date, end_date
    )
