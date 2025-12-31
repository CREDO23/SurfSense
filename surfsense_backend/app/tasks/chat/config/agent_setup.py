"""Agent creation and configuration."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.new_chat.chat_deepagent import create_surfsense_deep_agent
from app.agents.new_chat.checkpointer import get_checkpointer
from app.agents.new_chat.llm_config import AgentConfig
from app.services.connector_service import ConnectorService


async def create_configured_agent(
    llm: object,
    search_space_id: int,
    session: AsyncSession,
    connector_service: ConnectorService,
    agent_config: AgentConfig,
    firecrawl_api_key: str | None,
):
    """
    Create the configured deep agent with checkpointer and prompt settings.
    
    Args:
        llm: LLM instance (ChatLiteLLM)
        search_space_id: Search space ID
        session: Database session
        connector_service: Configured connector service
        agent_config: Agent configuration with prompts
        firecrawl_api_key: Optional Firecrawl API key
    
    Returns:
        Configured deep agent instance
    """
    # Get the PostgreSQL checkpointer for persistent conversation memory
    checkpointer = await get_checkpointer()

    # Create the deep agent with checkpointer and configurable prompts
    agent = create_surfsense_deep_agent(
        llm=llm,
        search_space_id=search_space_id,
        db_session=session,
        connector_service=connector_service,
        checkpointer=checkpointer,
        agent_config=agent_config,
        firecrawl_api_key=firecrawl_api_key,
    )

    return agent
