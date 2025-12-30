"""User and OAuth models."""

from fastapi_users.db import SQLAlchemyBaseOAuthAccountTableUUID, SQLAlchemyBaseUserTableUUID
from sqlalchemy import Column, Integer
from sqlalchemy.orm import Mapped, relationship

from app.config import config
from app.models.base import Base


if config.AUTH_TYPE == "GOOGLE":

    class OAuthAccount(SQLAlchemyBaseOAuthAccountTableUUID, Base):
        pass

    class User(SQLAlchemyBaseUserTableUUID, Base):
        oauth_accounts: Mapped[list[OAuthAccount]] = relationship(
            "OAuthAccount", lazy="joined"
        )
        search_spaces = relationship("SearchSpace", back_populates="user")

        search_space_memberships = relationship(
            "SearchSpaceMembership",
            back_populates="user",
            cascade="all, delete-orphan",
        )
        created_invites = relationship(
            "SearchSpaceInvite",
            back_populates="created_by",
            passive_deletes=True,
        )

        pages_limit = Column(
            Integer,
            nullable=False,
            default=config.PAGES_LIMIT,
            server_default=str(config.PAGES_LIMIT),
        )
        pages_used = Column(Integer, nullable=False, default=0, server_default="0")

else:

    class User(SQLAlchemyBaseUserTableUUID, Base):
        search_spaces = relationship("SearchSpace", back_populates="user")

        search_space_memberships = relationship(
            "SearchSpaceMembership",
            back_populates="user",
            cascade="all, delete-orphan",
        )
        created_invites = relationship(
            "SearchSpaceInvite",
            back_populates="created_by",
            passive_deletes=True,
        )

        pages_limit = Column(
            Integer,
            nullable=False,
            default=config.PAGES_LIMIT,
            server_default=str(config.PAGES_LIMIT),
        )
        pages_used = Column(Integer, nullable=False, default=0, server_default="0")
