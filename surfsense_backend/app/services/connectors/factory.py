from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

from .airtable_service import AirtableConnectorService
from .baidu_service import BaiduConnectorService
from .base import BaseConnectorService
from .bookstack_service import BookstackConnectorService
from .clickup_service import ClickupConnectorService
from .confluence_service import ConfluenceConnectorService
from .crawled_urls_service import CrawledUrlsConnectorService
from .discord_service import DiscordConnectorService
from .elasticsearch_service import ElasticsearchConnectorService
from .extension_service import ExtensionConnectorService
from .files_service import FilesConnectorService
from .github_service import GitHubConnectorService
from .google_calendar_service import GoogleCalendarConnectorService
from .google_gmail_service import GoogleGmailConnectorService
from .jira_service import JiraConnectorService
from .linear_service import LinearConnectorService
from .linkup_service import LinkupConnectorService
from .luma_service import LumaConnectorService
from .notes_service import NotesConnectorService
from .notion_service import NotionConnectorService
from .searxng_service import SearxngConnectorService
from .slack_service import SlackConnectorService
from .tavily_service import TavilyConnectorService
from .youtube_service import YoutubeConnectorService


class ConnectorFactory:
    """Factory for creating connector service instances."""

    _service_mapping: dict[str, type[BaseConnectorService]] = {
        "CRAWLED_URL": CrawledUrlsConnectorService,
        "FILE": FilesConnectorService,
        "GITHUB_CONNECTOR": GitHubConnectorService,
        "NOTION_CONNECTOR": NotionConnectorService,
        "SLACK_CONNECTOR": SlackConnectorService,
        "EXTENSION": ExtensionConnectorService,
        "YOUTUBE_VIDEO": YoutubeConnectorService,
        "LINEAR_CONNECTOR": LinearConnectorService,
        "JIRA_CONNECTOR": JiraConnectorService,
        "GOOGLE_CALENDAR_CONNECTOR": GoogleCalendarConnectorService,
        "AIRTABLE_CONNECTOR": AirtableConnectorService,
        "GOOGLE_GMAIL_CONNECTOR": GoogleGmailConnectorService,
        "CONFLUENCE_CONNECTOR": ConfluenceConnectorService,
        "CLICKUP_CONNECTOR": ClickupConnectorService,
        "LINKUP_CONNECTOR": LinkupConnectorService,
        "DISCORD_CONNECTOR": DiscordConnectorService,
        "LUMA_CONNECTOR": LumaConnectorService,
        "ELASTICSEARCH_CONNECTOR": ElasticsearchConnectorService,
        "NOTES_CONNECTOR": NotesConnectorService,
        "BOOKSTACK_CONNECTOR": BookstackConnectorService,
        "TAVILY_SEARCH": TavilyConnectorService,
        "SEARXNG_SEARCH": SearxngConnectorService,
        "BAIDU_SEARCH": BaiduConnectorService,
    }

    @classmethod
    def get_service(
        cls, connector_type: str, session: Session, search_space_id: int | None = None
    ) -> BaseConnectorService:
        """Get the appropriate connector service for the given type.

        Args:
            connector_type: The type of connector (e.g., 'GITHUB_CONNECTOR')
            session: Database session
            search_space_id: Optional search space ID

        Returns:
            An instance of the appropriate connector service

        Raises:
            ValueError: If the connector type is not recognized
        """
        service_class = cls._service_mapping.get(connector_type)
        if not service_class:
            raise ValueError(
                f"Unknown connector type: {connector_type}. "
                f"Available types: {', '.join(cls._service_mapping.keys())}"
            )

        return service_class(session, search_space_id)

    @classmethod
    def get_available_types(cls) -> list[str]:
        """Get a list of all available connector types.

        Returns:
            List of connector type strings
        """
        return list(cls._service_mapping.keys())
