"""Connector routes module - aggregates all connector-specific routes."""
from __future__ import annotations

from fastapi import APIRouter

from app.routes.connectors import (
    airtable,
    bookstack,
    clickup,
    confluence,
    discord,
    elasticsearch,
    github,
    google_calendar,
    google_gmail,
    jira,
    linear,
    luma,
    notion,
    slack,
    web_pages,
)

router = APIRouter(prefix="/connectors", tags=["connectors"])

router.include_router(github.router)
router.include_router(slack.router)
router.include_router(notion.router)
router.include_router(linear.router)
router.include_router(jira.router)
router.include_router(discord.router)
router.include_router(confluence.router)
router.include_router(clickup.router)
router.include_router(airtable.router)
router.include_router(google_calendar.router)
router.include_router(google_gmail.router)
router.include_router(luma.router)
router.include_router(elasticsearch.router)
router.include_router(web_pages.router)
router.include_router(bookstack.router)

__all__ = ["router"]
