"""Connector indexing task."""

from app.celery_app import celery_app
from app.tasks.celery_tasks.connectors.base_connector_task import BaseConnectorTask


class GoogleCalendarIndexer(BaseConnectorTask):
    """Connector indexer."""

    async def index_connector(
        self, session, connector_id, search_space_id, user_id, start_date, end_date
    ):
        from app.routes.connectors.google_calendar import run_google_calendar_indexing

        await run_google_calendar_indexing(
            session, connector_id, search_space_id, user_id, start_date, end_date
        )


@celery_app.task(name="index_google_calendar_events", bind=True)
def index_google_calendar_events_task(
    self, connector_id, search_space_id, user_id, start_date, end_date
):
    """Celery task."""
    GoogleCalendarIndexer().execute(
        connector_id, search_space_id, user_id, start_date, end_date
    )
