"""Connector indexing task."""

from app.celery_app import celery_app
from app.tasks.celery_tasks.connectors.base_connector_task import BaseConnectorTask


class DiscordIndexer(BaseConnectorTask):
    """Connector indexer."""

    async def index_connector(
        self, session, connector_id, search_space_id, user_id, start_date, end_date
    ):
        from app.routes.connectors.discord import run_discord_indexing

        await run_discord_indexing(
            session, connector_id, search_space_id, user_id, start_date, end_date
        )


@celery_app.task(name="index_discord_messages", bind=True)
def index_discord_messages_task(
    self, connector_id, search_space_id, user_id, start_date, end_date
):
    """Celery task."""
    DiscordIndexer().execute(
        connector_id, search_space_id, user_id, start_date, end_date
    )
