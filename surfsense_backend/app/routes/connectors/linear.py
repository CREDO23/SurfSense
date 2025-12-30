"""Linear connector routes and indexing functions."""
from __future__ import annotations

import logging

from fastapi import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import async_session_maker
from app.routes.connectors._shared import update_connector_last_indexed
from app.tasks.connector_indexers import index_linear_issues

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/linear", tags=["connectors:linear"])


async def run_linear_indexing_with_new_session(
    connector_id: int,
    search_space_id: int,
    user_id: str,
    start_date: str,
    end_date: str,
):
    async with async_session_maker() as session:
        await run_linear_indexing(
            session, connector_id, search_space_id, user_id, start_date, end_date
        )


async def run_linear_indexing(
    session: AsyncSession,
    connector_id: int,
    search_space_id: int,
    user_id: str,
    start_date: str,
    end_date: str,
):
    try:
        documents_processed, error_or_warning = await index_linear_issues(
            session=session,
            connector_id=connector_id,
            search_space_id=search_space_id,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            update_last_indexed=False,
        )

        if documents_processed > 0:
            await update_connector_last_indexed(session, connector_id)
            logger.info(
                f"Linear indexing completed: {documents_processed} documents processed"
            )
        else:
            logger.error(
                f"Linear indexing failed or no documents processed: {error_or_warning}"
            )
    except Exception as e:
        logger.error(f"Error in background Linear indexing task: {e!s}")
