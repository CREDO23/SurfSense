"""LLM configuration loading and initialization."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.new_chat.llm_config import (
    AgentConfig,
    create_chat_litellm_from_agent_config,
    create_chat_litellm_from_config,
    load_agent_config,
    load_llm_config_from_yaml,
)


async def load_llm_instance(
    session: AsyncSession,
    llm_config_id: int,
    search_space_id: int,
) -> tuple[object | None, AgentConfig | None, str | None]:
    """
    Load LLM instance and agent config from either YAML or database.
    
    Args:
        session: Database session
        llm_config_id: LLM config ID (negative for YAML, positive for database)
        search_space_id: Search space ID
    
    Returns:
        Tuple of (llm_instance, agent_config, error_message)
        If error_message is not None, llm_instance and agent_config will be None
    """
    agent_config: AgentConfig | None = None

    if llm_config_id >= 0:
        # Positive ID: Load from NewLLMConfig database table
        agent_config = await load_agent_config(
            session=session,
            config_id=llm_config_id,
            search_space_id=search_space_id,
        )
        if not agent_config:
            return None, None, f"Failed to load NewLLMConfig with id {llm_config_id}"

        # Create ChatLiteLLM from AgentConfig
        llm = create_chat_litellm_from_agent_config(agent_config)
    else:
        # Negative ID: Load from YAML (global configs)
        llm_config = load_llm_config_from_yaml(llm_config_id=llm_config_id)
        if not llm_config:
            return None, None, f"Failed to load LLM config with id {llm_config_id}"

        # Create ChatLiteLLM from YAML config dict
        llm = create_chat_litellm_from_config(llm_config)
        # Create AgentConfig from YAML for consistency (uses defaults for prompt settings)
        agent_config = AgentConfig.from_yaml_config(llm_config)

    if not llm:
        return None, None, "Failed to create LLM instance"

    return llm, agent_config, None
