"""Connector indexing task."""

from app.celery_app import celery_app
from app.tasks.celery_tasks.connectors.base_connector_task import BaseConnectorTask


class GithubIndexer(BaseConnectorTask):
    """Connector indexer."""

    async def index_connector(
        self, session, connector_id, search_space_id, user_id, start_date, end_date
    ):
        from app.routes.connectors.github import run_github_indexing

        await run_github_indexing(
            session, connector_id, search_space_id, user_id, start_date, end_date
        )


@celery_app.task(name="index_github_repos", bind=True)
def index_github_repos_task(
    self, connector_id, search_space_id, user_id, start_date, end_date
):
    """Celery task."""
    GithubIndexer().execute(
        connector_id, search_space_id, user_id, start_date, end_date
    )
