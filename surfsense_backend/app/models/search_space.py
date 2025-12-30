"""SearchSpace and related RBAC models (roles, memberships, invites)."""

from datetime import UTC, datetime

from sqlalchemy import (
    ARRAY,
    TIMESTAMP,
    Boolean,
    Column,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel, TimestampMixin


class SearchSpace(BaseModel, TimestampMixin):
    __tablename__ = "searchspaces"

    name = Column(String(100), nullable=False, index=True)
    description = Column(String(500), nullable=True)

    citations_enabled = Column(Boolean, nullable=False, default=True)
    qna_custom_instructions = Column(Text, nullable=True, default="")

    agent_llm_id = Column(Integer, nullable=True)
    document_summary_llm_id = Column(Integer, nullable=True)

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )
    user = relationship("User", back_populates="search_spaces")

    documents = relationship(
        "Document",
        back_populates="search_space",
        order_by="Document.id",
        cascade="all, delete-orphan",
    )
    new_chat_threads = relationship(
        "NewChatThread",
        back_populates="search_space",
        order_by="NewChatThread.updated_at.desc()",
        cascade="all, delete-orphan",
    )
    podcasts = relationship(
        "Podcast",
        back_populates="search_space",
        order_by="Podcast.id.desc()",
        cascade="all, delete-orphan",
    )
    logs = relationship(
        "Log",
        back_populates="search_space",
        order_by="Log.id",
        cascade="all, delete-orphan",
    )
    search_source_connectors = relationship(
        "SearchSourceConnector",
        back_populates="search_space",
        order_by="SearchSourceConnector.id",
        cascade="all, delete-orphan",
    )
    new_llm_configs = relationship(
        "NewLLMConfig",
        back_populates="search_space",
        order_by="NewLLMConfig.id",
        cascade="all, delete-orphan",
    )

    roles = relationship(
        "SearchSpaceRole",
        back_populates="search_space",
        order_by="SearchSpaceRole.id",
        cascade="all, delete-orphan",
    )
    memberships = relationship(
        "SearchSpaceMembership",
        back_populates="search_space",
        order_by="SearchSpaceMembership.id",
        cascade="all, delete-orphan",
    )
    invites = relationship(
        "SearchSpaceInvite",
        back_populates="search_space",
        order_by="SearchSpaceInvite.id",
        cascade="all, delete-orphan",
    )


class SearchSpaceRole(BaseModel, TimestampMixin):
    """Custom roles that can be defined per search space.
    Each search space can have multiple roles with different permission sets."""

    __tablename__ = "search_space_roles"
    __table_args__ = (
        UniqueConstraint(
            "search_space_id",
            "name",
            name="uq_searchspace_role_name",
        ),
    )

    name = Column(String(100), nullable=False, index=True)
    description = Column(String(500), nullable=True)
    permissions = Column(ARRAY(String), nullable=False, default=[])
    is_default = Column(Boolean, nullable=False, default=False)
    is_system_role = Column(Boolean, nullable=False, default=False)

    search_space_id = Column(
        Integer, ForeignKey("searchspaces.id", ondelete="CASCADE"), nullable=False
    )
    search_space = relationship("SearchSpace", back_populates="roles")

    memberships = relationship(
        "SearchSpaceMembership", back_populates="role", passive_deletes=True
    )
    invites = relationship(
        "SearchSpaceInvite", back_populates="role", passive_deletes=True
    )


class SearchSpaceMembership(BaseModel, TimestampMixin):
    """Tracks user membership in search spaces with their assigned role.
    Each user can be a member of multiple search spaces with different roles."""

    __tablename__ = "search_space_memberships"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "search_space_id",
            name="uq_user_searchspace_membership",
        ),
    )

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )
    search_space_id = Column(
        Integer, ForeignKey("searchspaces.id", ondelete="CASCADE"), nullable=False
    )
    role_id = Column(
        Integer,
        ForeignKey("search_space_roles.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_owner = Column(Boolean, nullable=False, default=False)
    joined_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )
    invited_by_invite_id = Column(
        Integer,
        ForeignKey("search_space_invites.id", ondelete="SET NULL"),
        nullable=True,
    )

    user = relationship("User", back_populates="search_space_memberships")
    search_space = relationship("SearchSpace", back_populates="memberships")
    role = relationship("SearchSpaceRole", back_populates="memberships")
    invited_by_invite = relationship(
        "SearchSpaceInvite", back_populates="used_by_memberships"
    )


class SearchSpaceInvite(BaseModel, TimestampMixin):
    """Invite links for search spaces.
    Users can create invite links with specific roles that others can use to join."""

    __tablename__ = "search_space_invites"

    invite_code = Column(String(64), nullable=False, unique=True, index=True)

    search_space_id = Column(
        Integer, ForeignKey("searchspaces.id", ondelete="CASCADE"), nullable=False
    )
    role_id = Column(
        Integer,
        ForeignKey("search_space_roles.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
    )

    expires_at = Column(TIMESTAMP(timezone=True), nullable=True)
    max_uses = Column(Integer, nullable=True)
    uses_count = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    name = Column(String(100), nullable=True)

    search_space = relationship("SearchSpace", back_populates="invites")
    role = relationship("SearchSpaceRole", back_populates="invites")
    created_by = relationship("User", back_populates="created_invites")
    used_by_memberships = relationship(
        "SearchSpaceMembership",
        back_populates="invited_by_invite",
        passive_deletes=True,
    )
