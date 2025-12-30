"""Connector routes module - aggregates all connector-specific routes."""
from __future__ import annotations

from fastapi import APIRouter

from app.routes.connectors import github

router = APIRouter(prefix="/connectors", tags=["connectors"])

router.include_router(github.router)

__all__ = ["router"]
