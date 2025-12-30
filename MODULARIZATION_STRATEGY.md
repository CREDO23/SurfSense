# FILE-BY-FILE MODULARIZATION STRATEGY

**Purpose**: Detailed breakdown of how to split each large file/class in the codebase  
**Audience**: Developers implementing the refactoring  
**Status**: Planning Document

---

## 🐍 BACKEND PYTHON MODULARIZATION

### 1. app/services/connector_service.py (2,508 lines)

**Status**: CRITICAL - Largest file in codebase  
**Priority**: 1 (Do this first)  
**Estimated Effort**: 3-4 days  
**Risk**: Medium (many dependencies)

#### Current Structure Analysis
```python
class ConnectorService:
    # 40+ methods for different connectors
    async def search_github_issues(...) -> tuple
    async def search_linear_issues(...) -> tuple
    async def search_jira_issues(...) -> tuple
    async def search_slack_messages(...) -> tuple
    async def search_notion_pages(...) -> tuple
    async def search_google_calendar_events(...) -> tuple
    async def search_google_gmail_messages(...) -> tuple
    async def search_luma_events(...) -> tuple
    async def search_discord_messages(...) -> tuple
    async def search_tavily(...) -> tuple
    async def search_linkup(...) -> tuple
    async def search_baidu(...) -> tuple
    async def search_searxng(...) -> tuple
    async def search_elasticsearch(...) -> tuple
    # ... and more
```

#### Proposed Split

```
app/services/connectors/
├── __init__.py                      # Exports all services + registry
├── base.py                          # Abstract base class
├── registry.py                      # Factory pattern for getting services
├── _shared.py                       # Shared utilities
├── github_service.py                # ~120 lines
├── linear_service.py                # ~120 lines
├── jira_service.py                  # ~130 lines
├── slack_service.py                 # ~110 lines
├── notion_service.py                # ~140 lines
├── google_calendar_service.py       # ~130 lines
├── google_gmail_service.py          # ~140 lines
├── luma_service.py                  # ~120 lines
├── discord_service.py               # ~100 lines
├── confluence_service.py            # ~110 lines
├── clickup_service.py               # ~110 lines
├── airtable_service.py              # ~100 lines
├── bookstack_service.py             # ~100 lines
├── web_search/                      # Web search connectors
│   ├── __init__.py
│   ├── tavily_service.py            # ~80 lines
│   ├── linkup_service.py            # ~80 lines
│   ├── baidu_service.py             # ~80 lines
│   └── searxng_service.py           # ~80 lines
└── elasticsearch_service.py         # ~90 lines
```

#### Implementation Steps

**Step 1: Create base.py**
```python
# app/services/connectors/base.py
from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.retriever.chunks_hybrid_search import ChucksHybridSearchRetriever
from app.retriever.documents_hybrid_search import DocumentHybridSearchRetriever


class BaseConnectorService(ABC):
    """Base class for all connector services."""
    
    def __init__(self, session: AsyncSession, search_space_id: int | None = None):
        self.session = session
        self.search_space_id = search_space_id
        self.chunk_retriever = ChucksHybridSearchRetriever(session)
        self.document_retriever = DocumentHybridSearchRetriever(session)
        self.source_id_counter = 100000
        self.counter_lock = asyncio.Lock()
    
    async def initialize_counter(self):
        """Initialize source_id_counter based on chunk count."""
        # Shared implementation for all connectors
        pass
    
    @abstractmethod
    async def search(
        self,
        user_query: str,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        **kwargs
    ) -> tuple:
        """Search using this connector.
        
        Returns:
            tuple: (sources_info, langchain_documents)
        """
        pass
    
    async def _combined_rrf_search(
        self,
        query_text: str,
        search_space_id: int,
        document_type: str,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ):
        """Shared RRF search logic."""
        # Move shared search logic here
        pass
```

**Step 2: Create registry.py**
```python
# app/services/connectors/registry.py
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.services.connectors.base import BaseConnectorService

logger = logging.getLogger(__name__)


class ConnectorRegistry:
    """Factory for creating connector service instances."""
    
    _services: dict[str, type[BaseConnectorService]] = {}
    
    @classmethod
    def register(cls, connector_type: str):
        """Decorator to register a connector service.
        
        Usage:
            @ConnectorRegistry.register('github')
            class GitHubConnectorService(BaseConnectorService):
                pass
        """
        def decorator(service_class: type[BaseConnectorService]):
            cls._services[connector_type] = service_class
            logger.info(f"Registered connector service: {connector_type}")
            return service_class
        return decorator
    
    @classmethod
    def get_service(
        cls,
        connector_type: str,
        session: AsyncSession,
        search_space_id: int | None = None
    ) -> BaseConnectorService:
        """Get a connector service instance.
        
        Args:
            connector_type: Type of connector (e.g., 'github', 'linear')
            session: Database session
            search_space_id: Optional search space ID
        
        Returns:
            Instance of the appropriate connector service
        
        Raises:
            ValueError: If connector type is not registered
        """
        service_class = cls._services.get(connector_type)
        if not service_class:
            available = ', '.join(cls._services.keys())
            raise ValueError(
                f"Unknown connector type: {connector_type}. "
                f"Available: {available}"
            )
        return service_class(session, search_space_id)
    
    @classmethod
    def list_connectors(cls) -> list[str]:
        """List all registered connector types."""
        return list(cls._services.keys())
```

**Step 3: Extract individual services**

Example for GitHub:
```python
# app/services/connectors/github_service.py
from __future__ import annotations

import logging
from datetime import datetime

from app.services.connectors.base import BaseConnectorService
from app.services.connectors.registry import ConnectorRegistry

logger = logging.getLogger(__name__)


@ConnectorRegistry.register('github')
class GitHubConnectorService(BaseConnectorService):
    """Service for searching GitHub issues and PRs."""
    
    async def search(
        self,
        user_query: str,
        top_k: int = 20,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        **kwargs
    ) -> tuple:
        """Search GitHub issues and PRs.
        
        Args:
            user_query: The search query
            top_k: Maximum number of results
            start_date: Filter by start date
            end_date: Filter by end date
        
        Returns:
            tuple: (sources_info, langchain_documents)
        """
        logger.info(
            "Searching GitHub: query=%s, top_k=%d, space_id=%s",
            user_query,
            top_k,
            self.search_space_id
        )
        
        # Move GitHub search logic here from ConnectorService.search_github_issues()
        github_docs = await self._combined_rrf_search(
            query_text=user_query,
            search_space_id=self.search_space_id,
            document_type="GITHUB_ISSUE",
            top_k=top_k,
            start_date=start_date,
            end_date=end_date,
        )
        
        if not github_docs:
            return {
                "id": 1,
                "name": "GitHub",
                "type": "GITHUB_ISSUE",
                "sources": [],
            }, []
        
        # Format results
        # ... rest of logic
        
        return sources_info, langchain_documents
```

**Step 4: Update __init__.py to export everything**
```python
# app/services/connectors/__init__.py
from __future__ import annotations

from app.services.connectors.base import BaseConnectorService
from app.services.connectors.registry import ConnectorRegistry

# Import all services to trigger registration
from app.services.connectors.github_service import GitHubConnectorService
from app.services.connectors.linear_service import LinearConnectorService
from app.services.connectors.jira_service import JiraConnectorService
# ... import all others

__all__ = [
    "BaseConnectorService",
    "ConnectorRegistry",
    "GitHubConnectorService",
    "LinearConnectorService",
    # ... all services
]
```

**Step 5: Update imports across codebase**

Find all imports:
```bash
grep -r "from app.services.connector_service import" --include="*.py"
grep -r "from app.services import connector_service" --include="*.py"
```

Replace with:
```python
# OLD
from app.services.connector_service import ConnectorService

# NEW
from app.services.connectors import ConnectorRegistry

# OLD usage
connector_service = ConnectorService(session, search_space_id)
result = await connector_service.search_github_issues(query, top_k=20)

# NEW usage
service = ConnectorRegistry.get_service('github', session, search_space_id)
result = await service.search(query, top_k=20)
```

**Step 6: Testing**
```bash
# Test each service individually
pytest tests/services/connectors/test_github_service.py -v
pytest tests/services/connectors/test_linear_service.py -v

# Test registry
pytest tests/services/connectors/test_registry.py -v

# Integration tests
pytest tests/integration/test_connector_search.py -v

# Full regression
pytest tests/ -v
```

**Step 7: Remove old file**
Once all tests pass:
```bash
git rm app/services/connector_service.py
git commit -m "refactor: split ConnectorService into modular services

- Created BaseConnectorService abstract class
- Implemented ConnectorRegistry factory pattern
- Split into 15+ connector-specific service files
- Updated all imports across codebase
- All tests passing
"
```

#### Migration Checklist
- [ ] Create base.py with BaseConnectorService
- [ ] Create registry.py with ConnectorRegistry
- [ ] Extract github_service.py
- [ ] Extract linear_service.py
- [ ] Extract jira_service.py
- [ ] Extract slack_service.py
- [ ] Extract notion_service.py
- [ ] Extract google_calendar_service.py
- [ ] Extract google_gmail_service.py
- [ ] Extract luma_service.py
- [ ] Extract discord_service.py
- [ ] Extract confluence_service.py
- [ ] Extract clickup_service.py
- [ ] Extract airtable_service.py
- [ ] Extract bookstack_service.py
- [ ] Extract web search services (4 files)
- [ ] Extract elasticsearch_service.py
- [ ] Update all imports
- [ ] Write unit tests for each service
- [ ] Run integration tests
- [ ] Remove old connector_service.py
- [ ] Update documentation

---

### 2. app/routes/search_source_connectors_routes.py (1,766 lines)

**Status**: CRITICAL - Second largest file  
**Priority**: 2  
**Estimated Effort**: 2-3 days  
**Risk**: Medium

#### Current Structure
```python
# All connector CRUD in one file
@router.post("/github")
async def create_github_connector(...): pass

@router.put("/github/{connector_id}")
async def update_github_connector(...): pass

@router.delete("/github/{connector_id}")
async def delete_github_connector(...): pass

@router.post("/github/{connector_id}/sync")
async def sync_github_connector(...): pass

# Repeat for 15+ connectors...
```

#### Proposed Split
```
app/routes/connectors/
├── __init__.py                      # Main router aggregator
├── _shared.py                       # Shared dependencies/utilities
├── github.py                        # ~100 lines
├── linear.py                        # ~100 lines
├── jira.py                          # ~110 lines
├── slack.py                         # ~90 lines
├── notion.py                        # ~120 lines
├── google_calendar.py               # ~110 lines
├── google_gmail.py                  # ~120 lines
├── luma.py                          # ~100 lines
├── discord.py                       # ~80 lines
├── confluence.py                    # ~90 lines
├── clickup.py                       # ~90 lines
├── airtable.py                      # ~80 lines
├── bookstack.py                     # ~80 lines
├── web_search.py                    # ~150 lines (all web search connectors)
└── elasticsearch.py                 # ~70 lines
```

#### Implementation Pattern

**Step 1: Create _shared.py for common dependencies**
```python
# app/routes/connectors/_shared.py
from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import User, SearchSourceConnector
from app.users import get_current_user
from app.utils.rbac import require_permission

if TYPE_CHECKING:
    from sqlalchemy.future import select


async def get_connector_or_404(
    connector_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> SearchSourceConnector:
    """Get connector by ID or raise 404."""
    from sqlalchemy.future import select
    
    result = await session.execute(
        select(SearchSourceConnector).where(
            SearchSourceConnector.id == connector_id
        )
    )
    connector = result.scalar_one_or_none()
    
    if not connector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connector not found"
        )
    
    # Check permissions
    if connector.search_space_id != current_user.search_space_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this connector"
        )
    
    return connector
```

**Step 2: Create individual route files**
```python
# app/routes/connectors/github.py
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import User, SearchSourceConnector, SearchSourceConnectorType
from app.routes.connectors._shared import get_connector_or_404
from app.schemas.search_source_connector import (
    GitHubConnectorCreate,
    GitHubConnectorUpdate,
    ConnectorResponse,
)
from app.tasks.celery_tasks.connector_tasks import sync_github_connector
from app.users import get_current_user
from app.utils.rbac import require_permission
from app.utils.validators import validate_github_config

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/github", tags=["connectors:github"])


@router.post("/", response_model=ConnectorResponse)
@require_permission("connectors:create")
async def create_github_connector(
    connector_data: GitHubConnectorCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a new GitHub connector."""
    logger.info(
        "Creating GitHub connector for user %s",
        current_user.id
    )
    
    # Validate config
    if not validate_github_config(connector_data.config):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid GitHub configuration"
        )
    
    # Create connector
    connector = SearchSourceConnector(
        search_space_id=current_user.search_space_id,
        type=SearchSourceConnectorType.GITHUB,
        name=connector_data.name,
        config=connector_data.config,
    )
    
    session.add(connector)
    await session.commit()
    await session.refresh(connector)
    
    # Trigger initial sync
    if connector_data.sync_on_create:
        sync_github_connector.delay(connector.id)
    
    return connector


@router.put("/{connector_id}", response_model=ConnectorResponse)
@require_permission("connectors:update")
async def update_github_connector(
    connector_id: int,
    connector_data: GitHubConnectorUpdate,
    connector: SearchSourceConnector = Depends(get_connector_or_404),
    session: AsyncSession = Depends(get_session),
):
    """Update a GitHub connector."""
    logger.info("Updating GitHub connector %s", connector_id)
    
    # Validate config if provided
    if connector_data.config:
        if not validate_github_config(connector_data.config):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid GitHub configuration"
            )
        connector.config = connector_data.config
    
    if connector_data.name:
        connector.name = connector_data.name
    
    await session.commit()
    await session.refresh(connector)
    
    return connector


@router.delete("/{connector_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission("connectors:delete")
async def delete_github_connector(
    connector_id: int,
    connector: SearchSourceConnector = Depends(get_connector_or_404),
    session: AsyncSession = Depends(get_session),
):
    """Delete a GitHub connector."""
    logger.info("Deleting GitHub connector %s", connector_id)
    
    await session.delete(connector)
    await session.commit()


@router.post("/{connector_id}/sync", status_code=status.HTTP_202_ACCEPTED)
@require_permission("connectors:sync")
async def sync_github_connector_endpoint(
    connector_id: int,
    connector: SearchSourceConnector = Depends(get_connector_or_404),
):
    """Trigger a sync for this GitHub connector."""
    logger.info("Triggering sync for GitHub connector %s", connector_id)
    
    # Trigger async task
    task = sync_github_connector.delay(connector_id)
    
    return {
        "message": "Sync started",
        "task_id": task.id,
        "connector_id": connector_id,
    }
```

**Step 3: Aggregate routes in __init__.py**
```python
# app/routes/connectors/__init__.py
from __future__ import annotations

from fastapi import APIRouter

from app.routes.connectors import (
    github,
    linear,
    jira,
    slack,
    notion,
    google_calendar,
    google_gmail,
    luma,
    discord,
    confluence,
    clickup,
    airtable,
    bookstack,
    web_search,
    elasticsearch,
)

# Create main router
router = APIRouter(prefix="/connectors", tags=["connectors"])

# Include all sub-routers
router.include_router(github.router)
router.include_router(linear.router)
router.include_router(jira.router)
router.include_router(slack.router)
router.include_router(notion.router)
router.include_router(google_calendar.router)
router.include_router(google_gmail.router)
router.include_router(luma.router)
router.include_router(discord.router)
router.include_router(confluence.router)
router.include_router(clickup.router)
router.include_router(airtable.router)
router.include_router(bookstack.router)
router.include_router(web_search.router)
router.include_router(elasticsearch.router)

__all__ = ["router"]
```

**Step 4: Update main.py**
```python
# main.py
# OLD
from app.routes import search_source_connectors_routes
app.include_router(search_source_connectors_routes.router)

# NEW
from app.routes.connectors import router as connectors_router
app.include_router(connectors_router)
```

#### Migration Checklist
- [ ] Create _shared.py with common utilities
- [ ] Extract github.py routes
- [ ] Extract linear.py routes
- [ ] Extract jira.py routes
- [ ] Extract slack.py routes
- [ ] Extract notion.py routes
- [ ] Extract google_calendar.py routes
- [ ] Extract google_gmail.py routes
- [ ] Extract luma.py routes
- [ ] Extract discord.py routes
- [ ] Extract confluence.py routes
- [ ] Extract clickup.py routes
- [ ] Extract airtable.py routes
- [ ] Extract bookstack.py routes
- [ ] Extract web_search.py routes
- [ ] Extract elasticsearch.py routes
- [ ] Create __init__.py aggregator
- [ ] Update main.py
- [ ] Test all endpoints
- [ ] Remove old file

---

### 3. app/db.py (976 lines) → app/models/ (8-10 files)

**Status**: HIGH PRIORITY  
**Priority**: 3  
**Estimated Effort**: 1-2 days  
**Risk**: Medium (many imports to update)

#### Current Structure
```python
# All models in one file
class User(Base): ...
class UserPreferences(Base): ...
class SearchSpace(Base): ...
class Membership(Base): ...
class Document(Base): ...
class Chunk(Base): ...
class ChatThread(Base): ...
class ChatMessage(Base): ...
class SearchSourceConnector(Base): ...
class LLMConfig(Base): ...
class Role(Base): ...
class Permission(Base): ...
class Log(Base): ...
# ... 20+ models
```

#### Proposed Split
```
app/models/
├── __init__.py               # Export all models
├── base.py                   # Base class and common mixins
├── user.py                   # User, UserPreferences (~100 lines)
├── search_space.py           # SearchSpace, Membership (~120 lines)
├── document.py               # Document, Chunk (~150 lines)
├── chat.py                   # ChatThread, ChatMessage (~120 lines)
├── connector.py              # SearchSourceConnector (~100 lines)
├── llm_config.py             # LLMConfig, LLMPreference (~80 lines)
├── rbac.py                   # Role, Permission, RolePermission (~90 lines)
└── log.py                    # Log (~60 lines)
```

#### Implementation

**Step 1: Create base.py**
```python
# app/models/base.py
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.orm import DeclarativeBase, declared_attr


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


class TimestampMixin:
    """Mixin for created_at and updated_at timestamps."""
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )


class PrimaryKeyMixin:
    """Mixin for integer primary key."""
    
    @declared_attr
    def id(cls):
        return Column(Integer, primary_key=True)
```

**Step 2: Extract model files**
```python
# app/models/user.py
from __future__ import annotations

from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship

from app.models.base import Base, PrimaryKeyMixin, TimestampMixin


class User(Base, PrimaryKeyMixin, TimestampMixin):
    """User model."""
    
    __tablename__ = "users"
    
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # Relationships
    preferences = relationship("UserPreferences", back_populates="user", uselist=False)
    memberships = relationship("Membership", back_populates="user")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"


class UserPreferences(Base, PrimaryKeyMixin):
    """User preferences model."""
    
    __tablename__ = "user_preferences"
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    theme = Column(String, default="light")
    # ... other preferences
    
    # Relationships
    user = relationship("User", back_populates="preferences")
```

**Step 3: Create __init__.py to export all**
```python
# app/models/__init__.py
from __future__ import annotations

from app.models.base import Base, TimestampMixin, PrimaryKeyMixin
from app.models.user import User, UserPreferences
from app.models.search_space import SearchSpace, Membership
from app.models.document import Document, Chunk
from app.models.chat import ChatThread, ChatMessage
from app.models.connector import SearchSourceConnector, SearchSourceConnectorType
from app.models.llm_config import LLMConfig, LLMPreference, LiteLLMProvider
from app.models.rbac import Role, Permission, RolePermission
from app.models.log import Log

__all__ = [
    # Base
    "Base",
    "TimestampMixin",
    "PrimaryKeyMixin",
    # User
    "User",
    "UserPreferences",
    # Search Space
    "SearchSpace",
    "Membership",
    # Document
    "Document",
    "Chunk",
    # Chat
    "ChatThread",
    "ChatMessage",
    # Connector
    "SearchSourceConnector",
    "SearchSourceConnectorType",
    # LLM
    "LLMConfig",
    "LLMPreference",
    "LiteLLMProvider",
    # RBAC
    "Role",
    "Permission",
    "RolePermission",
    # Log
    "Log",
]
```

**Step 4: Update all imports**
```bash
# Find all imports
grep -r "from app.db import" --include="*.py" surfsense_backend/

# Replace with
from app.models import User, Document, SearchSpace
# etc.
```

**Step 5: Update alembic env.py**
```python
# alembic/env.py
# OLD
from app.db import Base

# NEW
from app.models import Base
```

#### Migration Checklist
- [ ] Create base.py with Base and mixins
- [ ] Extract user.py
- [ ] Extract search_space.py
- [ ] Extract document.py
- [ ] Extract chat.py
- [ ] Extract connector.py
- [ ] Extract llm_config.py
- [ ] Extract rbac.py
- [ ] Extract log.py
- [ ] Create __init__.py
- [ ] Update all imports (find with grep)
- [ ] Update alembic env.py
- [ ] Test migrations
- [ ] Run full test suite
- [ ] Remove old db.py

---

## 📑 SUMMARY CHECKLIST

### High Priority (Do First)
1. [ ] Split ConnectorService (2,508 lines → 15+ files)
2. [ ] Split connector routes (1,766 lines → 15+ files)
3. [ ] Split db.py into models/ (976 lines → 8-10 files)

### Medium Priority
4. [ ] Split rbac_routes.py (1,085 lines)
5. [ ] Split file_processors.py (1,068 lines)
6. [ ] Split stream_new_chat.py (1,059 lines)
7. [ ] Split new_chat_routes.py (907 lines)
8. [ ] Split new_streaming_service.py (729 lines)
9. [ ] Split documents_routes.py (708 lines)
10. [ ] Split connector_tasks.py (689 lines)

### Function Refactoring
11. [ ] Refactor create_link_preview_tool() (215 lines)
12. [ ] Refactor validate_connector_config() (183 lines)
13. [ ] Refactor estimate_pages_before_processing() (175 lines)
14. [ ] Refactor get_issues_by_date_range() (141 lines)

### Testing After Each Split
```bash
# Run after each file split
pytest tests/ -v --cov=app
mypy app/ --check-untyped-defs
ruff check app/
```

---

## 📈 PROGRESS TRACKING

**Use this format for commits**:
```bash
git commit -m "refactor(connectors): split ConnectorService into modules

Split 2,508-line ConnectorService into:
- BaseConnectorService (abstract base)
- ConnectorRegistry (factory pattern)
- 15 connector-specific service files

Breaking changes: None
Backwards compatible: Yes
Tests: All passing
Files changed: 18 files
Lines removed: 2,508
Lines added: 2,200 (net -308)
"
```

**Track progress**:
- Create GitHub issues for each file
- Use project board to track
- Celebrate wins! 🎉

Good luck with the refactoring! 🚀
