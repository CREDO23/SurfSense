"""Log model."""

from sqlalchemy import JSON, Column, Enum as SQLAlchemyEnum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel, TimestampMixin
from app.models.enums import LogLevel, LogStatus


class Log(BaseModel, TimestampMixin):
    __tablename__ = "logs"

    level = Column(SQLAlchemyEnum(LogLevel), nullable=False, index=True)
    status = Column(SQLAlchemyEnum(LogStatus), nullable=False, index=True)
    message = Column(Text, nullable=False)
    source = Column(String(200), nullable=True, index=True)
    log_metadata = Column(JSON, nullable=True, default={})

    search_space_id = Column(
        Integer, ForeignKey("searchspaces.id", ondelete="CASCADE"), nullable=False
    )
    search_space = relationship("SearchSpace", back_populates="logs")
