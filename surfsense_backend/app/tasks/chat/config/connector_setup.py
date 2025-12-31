"""Connector service setup and configuration."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SearchSourceConnectorType
from app.services.connector_service import ConnectorService


async def setup_connector_service(
    session: AsyncSession,
    search_space_id: int,
) -> tuple[ConnectorService, str | None]:
    """
    Set up connector service and extract Firecrawl API key if configured.
    
    Args:
        session: Database session
        search_space_id: Search space ID
    
    Returns:
        Tuple of (connector_service, firecrawl_api_key)
    """
    connector_service = ConnectorService(session, search_space_id=search_space_id)

    # Get Firecrawl API key from webcrawler connector if configured
    firecrawl_api_key = None
    webcrawler_connector = await connector_service.get_connector_by_type(
        SearchSourceConnectorType.WEBCRAWLER_CONNECTOR, search_space_id
    )
    if webcrawler_connector and webcrawler_connector.config:
        firecrawl_api_key = webcrawler_connector.config.get("FIRECRAWL_API_KEY")

    return connector_service, firecrawl_api_key
