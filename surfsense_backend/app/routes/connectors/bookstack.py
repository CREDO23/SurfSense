"""BookStack connector routes and indexing functions."""
from __future__ import annotations

import logging

from fastapi import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import async_session_maker
from app.routes.connectors._shared import update_connector_last_indexed

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bookstack", tags=["connectors:bookstack"])


async def run_bookstack_indexing_with_new_session(
    connector_id: int,
    search_space_id: int,
    user_id: str,
    start_date: str,
    end_date: str,
):
    async with async_session_maker() as session:
        await run_bookstack_indexing(
            session, connector_id, search_space_id, user_id, start_date, end_date
        )


async def run_bookstack_indexing(
    session: AsyncSession,
    connector_id: int,
    search_space_id: int,
    user_id: str,
    start_date: str,
    end_date: str,
):
    from app.tasks.connector_indexers import index_bookstack_pages

    try:
        indexed_count, error_message = await index_bookstack_pages(
            session,
            connector_id,
            search_space_id,
            user_id,
            start_date,
            end_date,
            update_last_indexed=False,
        )
        if error_message:
            logger.error(
                f"BookStack indexing failed for connector {connector_id}: {error_message}"
            )
        elif indexed_count > 0:
            await update_connector_last_indexed(session, connector_id)
            logger.info(f"BookStack indexing completed: {indexed_count} pages indexed")
    except Exception as e:
        logger.error(f"Error in BookStack indexing task: {e!s}")
