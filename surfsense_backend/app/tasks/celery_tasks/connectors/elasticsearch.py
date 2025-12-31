"""Connector indexing task."""

from app.celery_app import celery_app
from app.tasks.celery_tasks.connectors.base_connector_task import BaseConnectorTask


class ElasticsearchIndexer(BaseConnectorTask):
    """Connector indexer."""

    async def index_connector(
        self, session, connector_id, search_space_id, user_id, start_date, end_date
    ):
        from app.routes.connectors.elasticsearch import run_elasticsearch_indexing

        await run_elasticsearch_indexing(
            session, connector_id, search_space_id, user_id, start_date, end_date
        )


@celery_app.task(name="index_elasticsearch_documents", bind=True)
def index_elasticsearch_documents_task(
    self, connector_id, search_space_id, user_id, start_date, end_date
):
    """Celery task."""
    ElasticsearchIndexer().execute(
        connector_id, search_space_id, user_id, start_date, end_date
    )
