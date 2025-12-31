"""Slack connector indexing task."""

from app.celery_app import celery_app
from app.tasks.celery_tasks.connectors.base_connector_task import BaseConnectorTask


class SlackIndexer(BaseConnectorTask):
    """Slack messages indexer."""

    async def index_connector(
        self, session, connector_id, search_space_id, user_id, start_date, end_date
    ):
        from app.routes.connectors.slack import run_slack_indexing

        await run_slack_indexing(
            session, connector_id, search_space_id, user_id, start_date, end_date
        )


@celery_app.task(name="index_slack_messages", bind=True)
def index_slack_messages_task(
    self, connector_id, search_space_id, user_id, start_date, end_date
):
    """Celery task to index Slack messages."""
    SlackIndexer().execute(
        connector_id, search_space_id, user_id, start_date, end_date
    )
