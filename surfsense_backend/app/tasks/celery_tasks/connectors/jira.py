"""Connector indexing task."""

from app.celery_app import celery_app
from app.tasks.celery_tasks.connectors.base_connector_task import BaseConnectorTask


class JiraIndexer(BaseConnectorTask):
    """Connector indexer."""

    async def index_connector(
        self, session, connector_id, search_space_id, user_id, start_date, end_date
    ):
        from app.routes.connectors.jira import run_jira_indexing

        await run_jira_indexing(
            session, connector_id, search_space_id, user_id, start_date, end_date
        )


@celery_app.task(name="index_jira_issues", bind=True)
def index_jira_issues_task(
    self, connector_id, search_space_id, user_id, start_date, end_date
):
    """Celery task."""
    JiraIndexer().execute(
        connector_id, search_space_id, user_id, start_date, end_date
    )
