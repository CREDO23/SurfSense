"""Celery tasks for connector indexing.

This module provides backward compatibility by re-exporting all connector tasks.
The actual implementation has been refactored into modular connector-specific files
in the connectors/ directory.
"""

# Re-export all connector tasks for backward compatibility
from app.tasks.celery_tasks.connectors import (
    index_airtable_records_task,
    index_bookstack_pages_task,
    index_clickup_tasks_task,
    index_confluence_pages_task,
    index_crawled_urls_task,
    index_discord_messages_task,
    index_elasticsearch_documents_task,
    index_github_repos_task,
    index_google_calendar_events_task,
    index_google_gmail_messages_task,
    index_jira_issues_task,
    index_linear_issues_task,
    index_luma_events_task,
    index_notion_pages_task,
    index_slack_messages_task,
)

__all__ = [
    "index_slack_messages_task",
    "index_notion_pages_task",
    "index_github_repos_task",
    "index_linear_issues_task",
    "index_jira_issues_task",
    "index_confluence_pages_task",
    "index_clickup_tasks_task",
    "index_google_calendar_events_task",
    "index_airtable_records_task",
    "index_google_gmail_messages_task",
    "index_discord_messages_task",
    "index_luma_events_task",
    "index_elasticsearch_documents_task",
    "index_crawled_urls_task",
    "index_bookstack_pages_task",
]
