"""Connector-specific Celery tasks."""

from app.tasks.celery_tasks.connectors.airtable import index_airtable_records_task
from app.tasks.celery_tasks.connectors.bookstack import index_bookstack_pages_task
from app.tasks.celery_tasks.connectors.clickup import index_clickup_tasks_task
from app.tasks.celery_tasks.connectors.confluence import index_confluence_pages_task
from app.tasks.celery_tasks.connectors.crawler import index_crawled_urls_task
from app.tasks.celery_tasks.connectors.discord import index_discord_messages_task
from app.tasks.celery_tasks.connectors.elasticsearch import index_elasticsearch_documents_task
from app.tasks.celery_tasks.connectors.github import index_github_repos_task
from app.tasks.celery_tasks.connectors.google_calendar import index_google_calendar_events_task
from app.tasks.celery_tasks.connectors.google_gmail import index_google_gmail_messages_task
from app.tasks.celery_tasks.connectors.jira import index_jira_issues_task
from app.tasks.celery_tasks.connectors.linear import index_linear_issues_task
from app.tasks.celery_tasks.connectors.luma import index_luma_events_task
from app.tasks.celery_tasks.connectors.notion import index_notion_pages_task
from app.tasks.celery_tasks.connectors.slack import index_slack_messages_task

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
