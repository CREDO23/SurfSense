"""Connector indexing task."""

from app.celery_app import celery_app
from app.tasks.celery_tasks.connectors.base_connector_task import BaseConnectorTask


class CrawlerIndexer(BaseConnectorTask):
    """Connector indexer."""

    async def index_connector(
        self, session, connector_id, search_space_id, user_id, start_date, end_date
    ):
        from app.routes.connectors.crawler import run_crawler_indexing

        await run_crawler_indexing(
            session, connector_id, search_space_id, user_id, start_date, end_date
        )


@celery_app.task(name="index_crawled_urls", bind=True)
def index_crawled_urls_task(
    self, connector_id, search_space_id, user_id, start_date, end_date
):
    """Celery task."""
    CrawlerIndexer().execute(
        connector_id, search_space_id, user_id, start_date, end_date
    )
