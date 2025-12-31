"""Connector indexing task."""

from app.celery_app import celery_app
from app.tasks.celery_tasks.connectors.base_connector_task import BaseConnectorTask


class GoogleGmailIndexer(BaseConnectorTask):
    """Connector indexer."""

    async def index_connector(
        self, session, connector_id, search_space_id, user_id, start_date, end_date
    ):
        from app.routes.connectors.google_gmail import run_google_gmail_indexing

        await run_google_gmail_indexing(
            session, connector_id, search_space_id, user_id, start_date, end_date
        )


@celery_app.task(name="index_google_gmail_messages", bind=True)
def index_google_gmail_messages_task(
    self, connector_id, search_space_id, user_id, start_date, end_date
):
    """Celery task."""
    GoogleGmailIndexer().execute(
        connector_id, search_space_id, user_id, start_date, end_date
    )
