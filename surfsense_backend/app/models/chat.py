"""Chat thread and message models."""

from sqlalchemy import TIMESTAMP, Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy import Enum as SQLAlchemyEnum
from datetime import UTC, datetime

from app.models.base import BaseModel, TimestampMixin
from app.models.enums import NewChatMessageRole


class NewChatThread(BaseModel, TimestampMixin):
    """Thread model for the new chat feature using assistant-ui.
    Each thread represents a conversation with message history.
    LangGraph checkpointer uses thread_id for state persistence."""

    __tablename__ = "new_chat_threads"

    title = Column(String(500), nullable=False, default="New Chat", index=True)
    archived = Column(Boolean, nullable=False, default=False)
    updated_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        index=True,
    )

    search_space_id = Column(
        Integer, ForeignKey("searchspaces.id", ondelete="CASCADE"), nullable=False
    )

    search_space = relationship("SearchSpace", back_populates="new_chat_threads")
    messages = relationship(
        "NewChatMessage",
        back_populates="thread",
        order_by="NewChatMessage.created_at",
        cascade="all, delete-orphan",
    )


class NewChatMessage(BaseModel, TimestampMixin):
    """Message model for the new chat feature.
    Stores individual messages in assistant-ui format."""

    __tablename__ = "new_chat_messages"

    role = Column(SQLAlchemyEnum(NewChatMessageRole), nullable=False)
    content = Column(JSONB, nullable=False)

    thread_id = Column(
        Integer,
        ForeignKey("new_chat_threads.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    thread = relationship("NewChatThread", back_populates="messages")
