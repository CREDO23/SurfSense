"""
Agent builder for streaming chat.

Handles creation and configuration of the SurfSense deep agent with all dependencies.
"""

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.new_chat.chat_deepagent import create_surfsense_deep_agent
from app.agents.new_chat.checkpointer import get_checkpointer
from app.agents.new_chat.llm_config import AgentConfig
from app.db import ChatVisibility
from app.services.connector_service import ConnectorService


async def build_agent(
    llm: Any,
    agent_config: AgentConfig,
    session: AsyncSession,
    search_space_id: int,
    chat_id: int,
    user_id: str | None = None,
    thread_visibility: ChatVisibility | None = None,
) -> Any:
    """
    Build and configure the SurfSense deep agent with all dependencies.

    Args:
        llm: The LLM instance
        agent_config: Agent configuration
        session: Database session
        search_space_id: Search space ID
        chat_id: Chat ID (used as thread_id)
        user_id: User ID (optional)
        thread_visibility: Thread visibility setting (defaults to PRIVATE)

    Returns:
        Configured SurfSense deep agent
    """
    # Create connector service
    connector_service = ConnectorService(session, search_space_id=search_space_id)

    # Get Firecrawl API key from webcrawler connector if configured
    from app.db import SearchSourceConnectorType

    firecrawl_api_key = None
    webcrawler_connector = await connector_service.get_connector_by_type(
        SearchSourceConnectorType.WEBCRAWLER_CONNECTOR, search_space_id
    )
    if webcrawler_connector and webcrawler_connector.config:
        firecrawl_api_key = webcrawler_connector.config.get("FIRECRAWL_API_KEY")

    # Get the PostgreSQL checkpointer for persistent conversation memory
    checkpointer = await get_checkpointer()

    visibility = thread_visibility or ChatVisibility.PRIVATE

    agent = await create_surfsense_deep_agent(
        llm=llm,
        search_space_id=search_space_id,
        db_session=session,
        connector_service=connector_service,
        checkpointer=checkpointer,
        user_id=user_id,
        thread_id=chat_id,
        agent_config=agent_config,
        firecrawl_api_key=firecrawl_api_key,
        thread_visibility=visibility,
    )

    return agent
