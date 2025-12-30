"""Centralized models module providing all models from the modular structure."""

from collections.abc import AsyncGenerator

from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import config
from app.models.base import (
    Base,
    BaseModel,
    TimestampMixin,
    async_session_maker,
    create_db_and_tables,
    engine,
    get_async_session,
    setup_indexes,
)
from app.models.chat import NewChatMessage, NewChatThread
from app.models.connector import SearchSourceConnector
from app.models.document import Chunk, Document
from app.models.enums import (
    DEFAULT_ROLE_PERMISSIONS,
    DocumentType,
    LiteLLMProvider,
    LogLevel,
    LogStatus,
    NewChatMessageRole,
    Permission,
    SearchSourceConnectorType,
    get_default_roles_config,
    has_all_permissions,
    has_any_permission,
    has_permission,
)
from app.models.llm_config import NewLLMConfig
from app.models.log import Log
from app.models.podcast import Podcast
from app.models.search_space import (
    SearchSpace,
    SearchSpaceInvite,
    SearchSpaceMembership,
    SearchSpaceRole,
)
from app.models.user import User

if config.AUTH_TYPE == "GOOGLE":
    from app.models.user import OAuthAccount

    async def get_user_db(session: AsyncSession = Depends(get_async_session)):
        yield SQLAlchemyUserDatabase(session, User, OAuthAccount)

    __all_models__ = [
        "Base", "BaseModel", "TimestampMixin", "engine", "async_session_maker",
        "setup_indexes", "create_db_and_tables", "get_async_session", "get_user_db",
        "DocumentType", "SearchSourceConnectorType", "LiteLLMProvider",
        "LogLevel", "LogStatus", "NewChatMessageRole", "Permission",
        "DEFAULT_ROLE_PERMISSIONS", "has_permission", "has_any_permission",
        "has_all_permissions", "get_default_roles_config", "NewChatThread",
        "NewChatMessage", "Document", "Chunk", "Podcast", "SearchSpace",
        "SearchSourceConnector", "NewLLMConfig", "Log", "SearchSpaceRole",
        "SearchSpaceMembership", "SearchSpaceInvite", "User", "OAuthAccount"
    ]

    __all__ = __all_models__

if config.AUTH_TYPE != "GOOGLE":

    async def get_user_db(session: AsyncSession = Depends(get_async_session)):
        yield SQLAlchemyUserDatabase(session, User)

    __all_models__ = [
        "Base", "BaseModel", "TimestampMixin", "engine", "async_session_maker",
        "setup_indexes", "create_db_and_tables", "get_async_session", "get_user_db",
        "DocumentType", "SearchSourceConnectorType", "LiteLLMProvider",
        "LogLevel", "LogStatus", "NewChatMessageRole", "Permission",
        "DEFAULT_ROLE_PERMISSIONS", "has_permission", "has_any_permission",
        "has_all_permissions", "get_default_roles_config", "NewChatThread",
        "NewChatMessage", "Document", "Chunk", "Podcast", "SearchSpace",
        "SearchSourceConnector", "NewLLMConfig", "Log", "SearchSpaceRole",
        "SearchSpaceMembership", "SearchSpaceInvite", "User"
    ]

    __all__ = __all_models__
