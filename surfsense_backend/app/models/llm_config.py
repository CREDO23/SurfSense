"""LLM configuration model."""

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Enum as SQLAlchemyEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.models.base import BaseModel, TimestampMixin
from app.models.enums import LiteLLMProvider


class NewLLMConfig(BaseModel, TimestampMixin):
    """New LLM configuration table that combines model settings with prompt configuration.

    This table provides:
    - LLM model configuration (provider, model_name, api_key, etc.)
    - Configurable system instructions (defaults to SURFSENSE_SYSTEM_INSTRUCTIONS)
    - Citation toggle (enable/disable citation instructions)

    Note: SURFSENSE_TOOLS_INSTRUCTIONS is always used and not configurable.
    """

    __tablename__ = "new_llm_configs"

    name = Column(String(100), nullable=False, index=True)
    description = Column(String(500), nullable=True)

    provider = Column(SQLAlchemyEnum(LiteLLMProvider), nullable=False)
    custom_provider = Column(String(100), nullable=True)
    model_name = Column(String(100), nullable=False)
    api_key = Column(String, nullable=False)
    api_base = Column(String(500), nullable=True)
    litellm_params = Column(JSON, nullable=True, default={})

    system_instructions = Column(Text, nullable=False, default="")
    use_default_system_instructions = Column(Boolean, nullable=False, default=True)

    citations_enabled = Column(Boolean, nullable=False, default=True)

    search_space_id = Column(
        Integer, ForeignKey("searchspaces.id", ondelete="CASCADE"), nullable=False
    )
    search_space = relationship("SearchSpace", back_populates="new_llm_configs")
