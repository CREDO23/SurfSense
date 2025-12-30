"""Shared utilities and dependencies for connector routes."""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import SearchSourceConnector, User, get_async_session
from app.users import current_active_user
from app.utils.rbac import check_permission

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)


async def get_connector_or_404(
    connector_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(current_active_user),
) -> SearchSourceConnector:
    """Get connector by ID or raise 404.
    
    Also performs permission check to ensure user can access this connector.
    """
    result = await session.execute(
        select(SearchSourceConnector).where(
            SearchSourceConnector.id == connector_id
        )
    )
    connector = result.scalar_one_or_none()
    
    if not connector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Connector with ID {connector_id} not found"
        )
    
    # Check if user has permission to access this connector's search space
    if not await check_permission(
        current_user.id,
        connector.search_space_id,
        "connectors:read",
        session
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this connector"
        )
    
    return connector


async def update_connector_last_indexed(
    session: AsyncSession, connector_id: int
) -> None:
    """Update the last_indexed timestamp for a connector."""
    from datetime import UTC, datetime
    
    result = await session.execute(
        select(SearchSourceConnector).where(
            SearchSourceConnector.id == connector_id
        )
    )
    connector = result.scalar_one_or_none()
    
    if connector:
        connector.last_indexed_at = datetime.now(UTC)
        await session.commit()
        logger.info(f"Updated last_indexed_at for connector {connector_id}")
    else:
        logger.warning(f"Connector {connector_id} not found for last_indexed update")
