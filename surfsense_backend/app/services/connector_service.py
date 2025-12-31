from __future__ import annotations

import asyncio
import logging
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.connectors.factory import ConnectorFactory

logger = logging.getLogger(__name__)


class ConnectorService:
    """Facade service that delegates to specialized connector services.
    
    This class maintains backward compatibility by providing the same interface
    while delegating all actual search operations to specialized connector services
    via the factory pattern.
    
    The original 2,510-line monolithic service has been split into 23 specialized
    connector services, each handling one type of connector (GitHub, Slack, etc.).
    """

    def __init__(self, session: AsyncSession, search_space_id: int | None = None):
        self.session = session
        self.search_space_id = search_space_id
        self.factory = ConnectorFactory()
        self.counter_lock = asyncio.Lock()

    async def initialize_counter(self):
        """Initialize counter - delegated to individual connector services."""
        # Each connector service manages its own counter if needed
        pass

    def _get_service(self, connector_type: str):
        """Get connector service instance from factory.
        
        Args:
            connector_type: The connector type string (e.g., 'CRAWLED_URL', 'GITHUB_CONNECTOR')
            
        Returns:
            An instance of the appropriate connector service
        """
        return self.factory.get_service(
            connector_type, self.session, self.search_space_id
        )

    # ===== Crawled URLs =====
    async def search_crawled_urls(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search for crawled URLs. Delegates to CrawledUrlsConnectorService."""
        service = self._get_service("CRAWLED_URL")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )

    # ===== Files =====
    async def search_files(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search for uploaded files. Delegates to FilesConnectorService."""
        service = self._get_service("FILE")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )

    # ===== Extension =====
    async def search_extension(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search extension data. Delegates to ExtensionConnectorService."""
        service = self._get_service("EXTENSION")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )

    # ===== Notes =====
    async def search_notes(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search notes. Delegates to NotesConnectorService."""
        service = self._get_service("NOTE")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )

    # ===== External Search APIs =====
    async def search_tavily(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
    ) -> tuple:
        """Search using Tavily API. Delegates to TavilyConnectorService."""
        service = self._get_service("TAVILY_SEARCH")
        return await service.search(user_query, search_space_id, top_k)

    async def search_searxng(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
    ) -> tuple:
        """Search using SearXNG API. Delegates to SearxngConnectorService."""
        service = self._get_service("SEARXNG_SEARCH")
        return await service.search(user_query, search_space_id, top_k)

    async def search_baidu(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
    ) -> tuple:
        """Search using Baidu API. Delegates to BaiduConnectorService."""
        service = self._get_service("BAIDU_SEARCH")
        return await service.search(user_query, search_space_id, top_k)

    async def search_linkup(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
    ) -> tuple:
        """Search using Linkup API. Delegates to LinkupConnectorService."""
        service = self._get_service("LINKUP_CONNECTOR")
        return await service.search(user_query, search_space_id, top_k)

    async def search_elasticsearch(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
    ) -> tuple:
        """Search using Elasticsearch. Delegates to ElasticsearchConnectorService."""
        service = self._get_service("ELASTICSEARCH_CONNECTOR")
        return await service.search(user_query, search_space_id, top_k)

    # ===== Third-Party Integrations =====
    async def search_slack(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search Slack messages. Delegates to SlackConnectorService."""
        service = self._get_service("SLACK_CONNECTOR")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )

    async def search_notion(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search Notion pages. Delegates to NotionConnectorService."""
        service = self._get_service("NOTION_CONNECTOR")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )

    async def search_youtube(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search YouTube transcripts. Delegates to YoutubeConnectorService."""
        service = self._get_service("YOUTUBE_VIDEO")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )

    async def search_github(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search GitHub repositories. Delegates to GithubConnectorService."""
        service = self._get_service("GITHUB_CONNECTOR")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )

    async def search_linear(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search Linear issues. Delegates to LinearConnectorService."""
        service = self._get_service("LINEAR_CONNECTOR")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )

    async def search_jira(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search Jira issues. Delegates to JiraConnectorService."""
        service = self._get_service("JIRA_CONNECTOR")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )

    async def search_google_calendar(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search Google Calendar events. Delegates to GoogleCalendarConnectorService."""
        service = self._get_service("GOOGLE_CALENDAR_CONNECTOR")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )

    async def search_airtable(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search Airtable records. Delegates to AirtableConnectorService."""
        service = self._get_service("AIRTABLE_CONNECTOR")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )

    async def search_google_gmail(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search Gmail messages. Delegates to GoogleGmailConnectorService."""
        service = self._get_service("GOOGLE_GMAIL_CONNECTOR")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )

    async def search_confluence(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search Confluence pages. Delegates to ConfluenceConnectorService."""
        service = self._get_service("CONFLUENCE_CONNECTOR")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )

    async def search_clickup(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search ClickUp tasks. Delegates to ClickupConnectorService."""
        service = self._get_service("CLICKUP_CONNECTOR")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )

    async def search_discord(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search Discord messages. Delegates to DiscordConnectorService."""
        service = self._get_service("DISCORD_CONNECTOR")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )

    async def search_luma(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search Luma events. Delegates to LumaConnectorService."""
        service = self._get_service("LUMA_CONNECTOR")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )

    async def search_bookstack(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple:
        """Search BookStack pages. Delegates to BookstackConnectorService."""
        service = self._get_service("BOOKSTACK_CONNECTOR")
        return await service.search(
            user_query, search_space_id, top_k, start_date, end_date
        )
