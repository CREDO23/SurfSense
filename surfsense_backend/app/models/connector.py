"""Search source connector model."""

from sqlalchemy import (
    JSON,
    TIMESTAMP,
    Boolean,
    Column,
    Enum as SQLAlchemyEnum,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel, TimestampMixin
from app.models.enums import SearchSourceConnectorType


class SearchSourceConnector(BaseModel, TimestampMixin):
    __tablename__ = "search_source_connectors"
    __table_args__ = (
        UniqueConstraint(
            "search_space_id",
            "user_id",
            "connector_type",
            name="uq_searchspace_user_connector_type",
        ),
    )

    name = Column(String(100), nullable=False, index=True)
    connector_type = Column(SQLAlchemyEnum(SearchSourceConnectorType), nullable=False)
    is_indexable = Column(Boolean, nullable=False, default=False)
    last_indexed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    config = Column(JSON, nullable=False)

    periodic_indexing_enabled = Column(Boolean, nullable=False, default=False)
    indexing_frequency_minutes = Column(Integer, nullable=True)
    next_scheduled_at = Column(TIMESTAMP(timezone=True), nullable=True)

    search_space_id = Column(
        Integer, ForeignKey("searchspaces.id", ondelete="CASCADE"), nullable=False
    )
    search_space = relationship(
        "SearchSpace", back_populates="search_source_connectors"
    )

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )
