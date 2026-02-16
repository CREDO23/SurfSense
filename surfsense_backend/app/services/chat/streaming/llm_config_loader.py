"""
LLM configuration loader for streaming chat.

Handles loading LLM configurations from both:
- YAML files (negative IDs for global configs)
- NewLLMConfig database table (positive IDs for user-created configs)
"""

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.new_chat.llm_config import (
    AgentConfig,
    create_chat_litellm_from_agent_config,
    create_chat_litellm_from_config,
    load_agent_config,
    load_llm_config_from_yaml,
)


@dataclass
class LLMConfigResult:
    """Result of loading LLM configuration."""

    llm: any
    agent_config: AgentConfig
    error: str | None = None


async def load_llm_config(
    llm_config_id: int,
    session: AsyncSession,
    search_space_id: int,
) -> LLMConfigResult:
    """
    Load LLM configuration and create LLM instance.

    Args:
        llm_config_id: The LLM configuration ID
            - Negative IDs: Load from YAML (global configs)
            - Positive IDs: Load from NewLLMConfig database table
        session: Database session
        search_space_id: Search space ID (for database configs)

    Returns:
        LLMConfigResult with llm, agent_config, and optional error message
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
            return LLMConfigResult(
                llm=None,
                agent_config=None,
                error=f"Failed to load NewLLMConfig with id {llm_config_id}",
            )

        llm = create_chat_litellm_from_agent_config(agent_config)
    else:
        # Negative ID: Load from YAML (global configs)
        llm_config = load_llm_config_from_yaml(llm_config_id=llm_config_id)
        if not llm_config:
            return LLMConfigResult(
                llm=None,
                agent_config=None,
                error=f"Failed to load LLM config with id {llm_config_id}",
            )

        llm = create_chat_litellm_from_config(llm_config)
        agent_config = AgentConfig.from_yaml_config(llm_config)

    if not llm:
        return LLMConfigResult(
            llm=None,
            agent_config=agent_config,
            error="Failed to create LLM instance",
        )

    return LLMConfigResult(llm=llm, agent_config=agent_config)
