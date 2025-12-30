"""Podcast model."""

from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.models.base import BaseModel, TimestampMixin


class Podcast(BaseModel, TimestampMixin):
    """Podcast model for storing generated podcasts."""

    __tablename__ = "podcasts"

    title = Column(String(500), nullable=False)
    podcast_transcript = Column(JSONB, nullable=True)
    file_location = Column(Text, nullable=True)

    search_space_id = Column(
        Integer, ForeignKey("searchspaces.id", ondelete="CASCADE"), nullable=False
    )
    search_space = relationship("SearchSpace", back_populates="podcasts")
