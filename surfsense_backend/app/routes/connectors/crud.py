"""CRUD operations for search source connectors."""
from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.connectors.github_connector import GitHubConnector
from app.db import (
    Permission,
    SearchSourceConnector,
    User,
    get_async_session,
)
from app.schemas import (
    SearchSourceConnectorCreate,
    SearchSourceConnectorRead,
    SearchSourceConnectorUpdate,
)
from app.tasks.connector_indexers import (
    index_airtable_records,
    index_bookstack_pages,
    index_clickup_tasks,
    index_confluence_pages,
    index_crawled_urls,
    index_discord_messages,
    index_elasticsearch_documents,
    index_github_repos,
    index_google_calendar_events,
    index_google_gmail_messages,
    index_jira_issues,
    index_linear_issues,
    index_luma_events,
    index_notion_pages,
    index_slack_messages,
)
from app.users import current_active_user
from app.utils.periodic_scheduler import (
    create_periodic_schedule,
    delete_periodic_schedule,
    update_periodic_schedule,
)
from app.utils.rbac import check_permission

logger = logging.getLogger(__name__)

router = APIRouter()


class GitHubPATRequest(BaseModel):
    """Request model for GitHub PAT validation."""

    github_pat: str = Field(..., description="GitHub Personal Access Token")


@router.post("/github/repositories", response_model=list[dict[str, Any]])
async def list_github_repositories(
    pat_request: GitHubPATRequest,
    user: User = Depends(current_active_user),
):
    """
    Fetches a list of repositories accessible by the provided GitHub PAT.
    The PAT is used for this request only and is not stored.
    """
    try:
        github_client = GitHubConnector(token=pat_request.github_pat)
        repositories = github_client.get_user_repositories()
        return repositories
    except ValueError as e:
        logger.error(f"GitHub PAT validation failed for user {user.id}: {e!s}")
        raise HTTPException(status_code=400, detail=f"Invalid GitHub PAT: {e!s}") from e
    except Exception as e:
        logger.error(f"Failed to fetch GitHub repositories for user {user.id}: {e!s}")
        raise HTTPException(
            status_code=500, detail="Failed to fetch GitHub repositories."
        ) from e


@router.post("/search-source-connectors", response_model=SearchSourceConnectorRead)
async def create_search_source_connector(
    connector: SearchSourceConnectorCreate,
    search_space_id: int = Query(
        ..., description="ID of the search space to associate the connector with"
    ),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Create a new search source connector.
    Requires CONNECTORS_CREATE permission.
    """
    try:
        await check_permission(
            session,
            user,
            search_space_id,
            Permission.CONNECTORS_CREATE.value,
            "You don't have permission to create connectors in this search space",
        )

        result = await session.execute(
            select(SearchSourceConnector).filter(
                SearchSourceConnector.search_space_id == search_space_id,
                SearchSourceConnector.connector_type == connector.connector_type,
            )
        )
        existing_connector = result.scalars().first()
        if existing_connector:
            raise HTTPException(
                status_code=409,
                detail=f"A connector with type {connector.connector_type} already exists in this search space.",
            )

        connector_data = connector.model_dump()

        if (
            connector.periodic_indexing_enabled
            and connector.indexing_frequency_minutes
            and connector.next_scheduled_at is None
        ):
            connector_data["next_scheduled_at"] = datetime.now(UTC) + timedelta(
                minutes=connector.indexing_frequency_minutes
            )

        db_connector = SearchSourceConnector(
            **connector_data, search_space_id=search_space_id, user_id=user.id
        )
        session.add(db_connector)
        await session.commit()
        await session.refresh(db_connector)

        if (
            db_connector.periodic_indexing_enabled
            and db_connector.indexing_frequency_minutes
        ):
            success = create_periodic_schedule(
                connector_id=db_connector.id,
                search_space_id=search_space_id,
                user_id=str(user.id),
                connector_type=db_connector.connector_type,
                frequency_minutes=db_connector.indexing_frequency_minutes,
            )
            if not success:
                logger.warning(
                    f"Failed to create periodic schedule for connector {db_connector.id}"
                )

        return db_connector
    except ValidationError as e:
        await session.rollback()
        raise HTTPException(status_code=422, detail=f"Validation error: {e!s}") from e
    except IntegrityError as e:
        await session.rollback()
        raise HTTPException(
            status_code=409,
            detail=f"Integrity error: A connector with this type already exists in this search space. {e!s}",
        ) from e
    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        logger.error(f"Failed to create search source connector: {e!s}")
        await session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create search source connector: {e!s}",
        ) from e


@router.get("/search-source-connectors", response_model=list[SearchSourceConnectorRead])
async def read_search_source_connectors(
    skip: int = 0,
    limit: int = 100,
    search_space_id: int | None = None,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    List all search source connectors for a search space.
    Requires CONNECTORS_READ permission.
    """
    try:
        if search_space_id is None:
            raise HTTPException(
                status_code=400,
                detail="search_space_id is required",
            )

        await check_permission(
            session,
            user,
            search_space_id,
            Permission.CONNECTORS_READ.value,
            "You don't have permission to view connectors in this search space",
        )

        query = select(SearchSourceConnector).filter(
            SearchSourceConnector.search_space_id == search_space_id
        )
        result = await session.execute(query.offset(skip).limit(limit))
        return result.scalars().all()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch search source connectors: {e!s}",
        ) from e


@router.get(
    "/search-source-connectors/{connector_id}",
    response_model=SearchSourceConnectorRead,
)
async def read_search_source_connector(
    connector_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Get a specific search source connector.
    Requires CONNECTORS_READ permission.
    """
    try:
        result = await session.execute(
            select(SearchSourceConnector).filter(
                SearchSourceConnector.id == connector_id
            )
        )
        db_connector = result.scalars().first()

        if not db_connector:
            raise HTTPException(status_code=404, detail="Connector not found")

        await check_permission(
            session,
            user,
            db_connector.search_space_id,
            Permission.CONNECTORS_READ.value,
            "You don't have permission to view this connector",
        )

        return db_connector
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch search source connector: {e!s}",
        ) from e


@router.put(
    "/search-source-connectors/{connector_id}",
    response_model=SearchSourceConnectorRead,
)
async def update_search_source_connector(
    connector_id: int,
    connector: SearchSourceConnectorUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Update a search source connector.
    Requires CONNECTORS_UPDATE permission.
    """
    try:
        result = await session.execute(
            select(SearchSourceConnector).filter(
                SearchSourceConnector.id == connector_id
            )
        )
        db_connector = result.scalars().first()

        if not db_connector:
            raise HTTPException(status_code=404, detail="Connector not found")

        await check_permission(
            session,
            user,
            db_connector.search_space_id,
            Permission.CONNECTORS_UPDATE.value,
            "You don't have permission to update this connector",
        )

        update_data = connector.model_dump(exclude_unset=True)

        if "config" in update_data and update_data["config"] is not None:
            existing_config = db_connector.config or {}
            incoming_config = update_data["config"]
            merged_config = {**existing_config, **incoming_config}
            update_data["config"] = merged_config

        for key, value in update_data.items():
            if key == "connector_type" and value != db_connector.connector_type:
                check_result = await session.execute(
                    select(SearchSourceConnector).filter(
                        SearchSourceConnector.search_space_id
                        == db_connector.search_space_id,
                        SearchSourceConnector.connector_type == value,
                        SearchSourceConnector.id != connector_id,
                    )
                )
                existing_connector = check_result.scalars().first()
                if existing_connector:
                    raise HTTPException(
                        status_code=409,
                        detail=f"A connector with type {value} already exists in this search space.",
                    )

            setattr(db_connector, key, value)

        try:
            await session.commit()
            await session.refresh(db_connector)

            if (
                "periodic_indexing_enabled" in update_data
                or "indexing_frequency_minutes" in update_data
            ):
                if (
                    db_connector.periodic_indexing_enabled
                    and db_connector.indexing_frequency_minutes
                ):
                    success = update_periodic_schedule(
                        connector_id=db_connector.id,
                        search_space_id=db_connector.search_space_id,
                        user_id=str(user.id),
                        connector_type=db_connector.connector_type,
                        frequency_minutes=db_connector.indexing_frequency_minutes,
                    )
                    if not success:
                        logger.warning(
                            f"Failed to update periodic schedule for connector {db_connector.id}"
                        )
                else:
                    success = delete_periodic_schedule(db_connector.id)
                    if not success:
                        logger.warning(
                            f"Failed to delete periodic schedule for connector {db_connector.id}"
                        )

            return db_connector
        except IntegrityError as e:
            await session.rollback()
            raise HTTPException(
                status_code=409, detail=f"Database integrity error during update: {e!s}"
            ) from e
        except Exception as e:
            await session.rollback()
            logger.error(
                f"Failed to update search source connector {connector_id}: {e}",
                exc_info=True,
            )
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update search source connector: {e!s}",
            ) from e
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update connector: {e!s}",
        ) from e


@router.delete("/search-source-connectors/{connector_id}", response_model=dict)
async def delete_search_source_connector(
    connector_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Delete a search source connector.
    Requires CONNECTORS_DELETE permission.
    """
    try:
        result = await session.execute(
            select(SearchSourceConnector).filter(
                SearchSourceConnector.id == connector_id
            )
        )
        db_connector = result.scalars().first()

        if not db_connector:
            raise HTTPException(status_code=404, detail="Connector not found")

        await check_permission(
            session,
            user,
            db_connector.search_space_id,
            Permission.CONNECTORS_DELETE.value,
            "You don't have permission to delete this connector",
        )

        if db_connector.periodic_indexing_enabled:
            success = delete_periodic_schedule(connector_id)
            if not success:
                logger.warning(
                    f"Failed to delete periodic schedule for connector {connector_id}"
                )

        await session.delete(db_connector)
        await session.commit()
        return {"message": "Search source connector deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete search source connector: {e!s}",
        ) from e


@router.post(
    "/search-source-connectors/{connector_id}/index", response_model=dict[str, Any]
)
async def trigger_connector_index(
    connector_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Trigger indexing for a specific connector.
    Requires CONNECTORS_INDEX permission.
    """
    try:
        result = await session.execute(
            select(SearchSourceConnector).filter(
                SearchSourceConnector.id == connector_id
            )
        )
        db_connector = result.scalars().first()

        if not db_connector:
            raise HTTPException(status_code=404, detail="Connector not found")

        await check_permission(
            session,
            user,
            db_connector.search_space_id,
            Permission.CONNECTORS_INDEX.value,
            "You don't have permission to index this connector",
        )

        connector_type = db_connector.connector_type
        search_space_id = db_connector.search_space_id

        indexing_tasks = {
            "GITHUB_CONNECTOR": index_github_repos,
            "SLACK_CONNECTOR": index_slack_messages,
            "NOTION_CONNECTOR": index_notion_pages,
            "LINEAR_CONNECTOR": index_linear_issues,
            "JIRA_CONNECTOR": index_jira_issues,
            "GOOGLE_CALENDAR_CONNECTOR": index_google_calendar_events,
            "GOOGLE_GMAIL_CONNECTOR": index_google_gmail_messages,
            "AIRTABLE_CONNECTOR": index_airtable_records,
            "CONFLUENCE_CONNECTOR": index_confluence_pages,
            "CLICKUP_CONNECTOR": index_clickup_tasks,
            "DISCORD_CONNECTOR": index_discord_messages,
            "LUMA_CONNECTOR": index_luma_events,
            "ELASTICSEARCH_CONNECTOR": index_elasticsearch_documents,
            "CRAWLED_URLS_CONNECTOR": index_crawled_urls,
            "BOOKSTACK_CONNECTOR": index_bookstack_pages,
        }

        task_fn = indexing_tasks.get(connector_type)
        if not task_fn:
            raise HTTPException(
                status_code=400,
                detail=f"Indexing not supported for connector type: {connector_type}",
            )

        task = task_fn.delay(connector_id, search_space_id)
        return {"task_id": task.id, "status": "Indexing task submitted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to trigger indexing for connector {connector_id}: {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to trigger indexing: {e!s}",
        ) from e
