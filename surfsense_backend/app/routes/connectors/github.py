"""GitHub connector routes."""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.connectors.github_connector import GitHubConnector
from app.db import User
from app.users import current_active_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/github", tags=["connectors:github"])


class GitHubPATRequest(BaseModel):
    github_pat: str = Field(..., description="GitHub Personal Access Token")


@router.post("/repositories", response_model=list[dict[str, Any]])
async def list_github_repositories(
    pat_request: GitHubPATRequest,
    user: User = Depends(current_active_user),
):
    try:
        github_client = GitHubConnector(token=pat_request.github_pat)
        repositories = github_client.get_user_repositories()
        logger.info(f"Fetched {len(repositories)} repositories for user {user.id}")
        return repositories
    except ValueError as e:
        logger.error(f"GitHub PAT validation failed for user {user.id}: {e!s}")
        raise HTTPException(status_code=400, detail=f"Invalid GitHub PAT: {e!s}") from e
    except Exception as e:
        logger.error(f"Failed to fetch GitHub repositories for user {user.id}: {e!s}")
        raise HTTPException(
            status_code=500, detail="Failed to fetch GitHub repositories."
        ) from e
