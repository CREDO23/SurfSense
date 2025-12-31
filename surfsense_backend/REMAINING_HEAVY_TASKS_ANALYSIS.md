# Remaining Heavy Long-Running Tasks - Analysis

**Date**: December 31, 2024  
**Status**: Analysis of remaining Celery tasks for refactoring

---

## Summary

### Already Refactored ✅
1. `file_processors.py` (1,069 → 654 lines, -39%) ✅
2. `stream_new_chat.py` (1,061 → 221 lines, -79%) ✅
3. `connector_tasks.py` (688 → 567 lines across 17 files) ✅

### Remaining Heavy Task Files

| File | Lines | Type | Priority | Est. Time |
|------|-------|------|----------|----------|
| `celery_tasks/document_tasks.py` | 270 | Celery wrappers | HIGH | 1-2 hours |
| `celery_tasks/podcast_tasks.py` | 178 | Celery wrapper | MEDIUM | 1 hour |
| `celery_tasks/document_reindex_tasks.py` | 184 | Celery wrapper | MEDIUM | 1 hour |
| `celery_tasks/blocknote_migration_tasks.py` | 168 | Celery wrapper | LOW | 1 hour |
| `celery_tasks/schedule_checker_task.py` | 131 | Celery wrapper | LOW | 30 min |

**Total Remaining**: ~931 lines across 5 files (3-6 hours estimated)

---

## File 1: document_tasks.py (270 lines) - PRIORITY 1

### Current Structure

**File**: `app/tasks/celery_tasks/document_tasks.py`  
**Lines**: 270  
**Issue**: 3 Celery tasks with identical wrapper pattern

**Tasks**:
1. `process_extension_document_task()` - Lines 33-126 (94 lines)
2. `process_youtube_video_task()` - Lines 127-191 (65 lines)
3. `process_file_upload_task()` - Lines 192-270 (79 lines)

### Pattern (100% Duplication)

Each task follows this identical structure:

```python
@celery_app.task(name="task_name", bind=True)
def task_wrapper(self, ...params):
    """
    Celery task wrapper.
    """
    import asyncio
    
    # Create new event loop (DUPLICATION)
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        loop.run_until_complete(_async_task_impl(...params))
    finally:
        loop.close()


async def _async_task_impl(...params):
    """Actual async implementation."""
    async with get_celery_session_maker()() as session:
        task_logger = TaskLoggingService(session, search_space_id)
        
        log_entry = await task_logger.log_task_start(...)
        
        try:
            result = await actual_processor(...params)
            
            if result:
                await task_logger.log_task_success(...)
            else:
                await task_logger.log_task_success(..., duplicate=True)
        except Exception as e:
            await task_logger.log_task_failure(...)
            logger.error(...)
            raise
```

### Refactoring Strategy

**Pattern**: Template Method + Decorator

**Step 1**: Create base task class

```python
# app/tasks/celery_tasks/base_document_task.py

from abc import ABC, abstractmethod
import asyncio
import logging
from typing import Any, Dict

from sqlalchemy.ext.asyncio import AsyncSession

from app.celery_app import celery_app
from app.services.task_logging_service import TaskLoggingService

logger = logging.getLogger(__name__)


class BaseDocumentTask(ABC):
    """Base class for document processing Celery tasks."""
    
    @property
    @abstractmethod
    def task_name(self) -> str:
        """Task name for Celery registration."""
        pass
    
    @property
    @abstractmethod
    def source_type(self) -> str:
        """Document source type for logging."""
        pass
    
    @abstractmethod
    async def process(self, session: AsyncSession, **kwargs) -> Any:
        """Process the document. Override in subclass."""
        pass
    
    @abstractmethod
    def get_log_metadata(self, **kwargs) -> Dict[str, Any]:
        """Get metadata for logging. Override in subclass."""
        pass
    
    @abstractmethod
    def get_log_message(self, **kwargs) -> str:
        """Get log message. Override in subclass."""
        pass
    
    async def execute(self, search_space_id: int, user_id: str, **kwargs):
        """Template method - defines the task execution workflow."""
        from app.tasks.celery_tasks.document_tasks import get_celery_session_maker
        
        async with get_celery_session_maker()() as session:
            task_logger = TaskLoggingService(session, search_space_id)
            
            log_entry = await task_logger.log_task_start(
                task_name=self.task_name,
                source=self.source_type,
                message=self.get_log_message(**kwargs),
                metadata=self.get_log_metadata(**kwargs),
            )
            
            try:
                result = await self.process(session, search_space_id, user_id, **kwargs)
                
                if result:
                    await task_logger.log_task_success(
                        log_entry,
                        self.get_success_message(result),
                        self.get_success_metadata(result),
                    )
                else:
                    await task_logger.log_task_success(
                        log_entry,
                        self.get_duplicate_message(**kwargs),
                        {"duplicate_detected": True},
                    )
            except Exception as e:
                await task_logger.log_task_failure(
                    log_entry,
                    self.get_failure_message(**kwargs),
                    str(e),
                    {"error_type": type(e).__name__},
                )
                logger.error(f"Error in {self.task_name}: {e!s}")
                raise
    
    def create_celery_task(self):
        """Create Celery task wrapper with event loop management."""
        
        def task_wrapper(self_celery, **kwargs):
            import asyncio
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                loop.run_until_complete(self.execute(**kwargs))
            finally:
                loop.close()
        
        return celery_app.task(name=self.task_name, bind=True)(task_wrapper)
    
    # Helper methods (can be overridden)
    def get_success_message(self, result) -> str:
        return f"Successfully processed {self.source_type}"
    
    def get_success_metadata(self, result) -> Dict[str, Any]:
        return {"document_id": getattr(result, 'id', None)}
    
    def get_duplicate_message(self, **kwargs) -> str:
        return f"{self.source_type} document already exists (duplicate)"
    
    def get_failure_message(self, **kwargs) -> str:
        return f"Failed to process {self.source_type}"
```

**Step 2**: Create task-specific implementations

```python
# app/tasks/celery_tasks/document_tasks/extension_task.py

from typing import Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession

from app.tasks.document_processors import add_extension_received_document
from .base import BaseDocumentTask


class ExtensionDocumentTask(BaseDocumentTask):
    """Process extension document."""
    
    @property
    def task_name(self) -> str:
        return "process_extension_document"
    
    @property
    def source_type(self) -> str:
        return "document_processor"
    
    async def process(self, session: AsyncSession, search_space_id: int, 
                     user_id: str, individual_document_dict: dict) -> Any:
        # Reconstruct document from dict
        from pydantic import BaseModel, ConfigDict, Field
        
        class DocumentMetadata(BaseModel):
            VisitedWebPageTitle: str
            VisitedWebPageURL: str
            BrowsingSessionId: str
            VisitedWebPageDateWithTimeInISOString: str
            VisitedWebPageReffererURL: str
            VisitedWebPageVisitDurationInMilliseconds: str
        
        class IndividualDocument(BaseModel):
            model_config = ConfigDict(populate_by_name=True)
            metadata: DocumentMetadata
            page_content: str = Field(alias="pageContent")
        
        individual_document = IndividualDocument(**individual_document_dict)
        
        return await add_extension_received_document(
            session, individual_document, search_space_id, user_id
        )
    
    def get_log_metadata(self, individual_document_dict: dict, **kwargs) -> Dict[str, Any]:
        return {
            "document_type": "EXTENSION",
            "url": individual_document_dict["metadata"]["VisitedWebPageURL"],
            "title": individual_document_dict["metadata"]["VisitedWebPageTitle"],
            "user_id": kwargs.get("user_id"),
        }
    
    def get_log_message(self, individual_document_dict: dict, **kwargs) -> str:
        title = individual_document_dict["metadata"]["VisitedWebPageTitle"]
        return f"Starting processing of extension document from {title}"


# Create and register task
extension_task = ExtensionDocumentTask()
process_extension_document_task = extension_task.create_celery_task()
```

```python
# app/tasks/celery_tasks/document_tasks/youtube_task.py

from typing import Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession

from app.tasks.document_processors import add_youtube_video_document
from .base import BaseDocumentTask


class YouTubeVideoTask(BaseDocumentTask):
    """Process YouTube video document."""
    
    @property
    def task_name(self) -> str:
        return "process_youtube_video"
    
    @property
    def source_type(self) -> str:
        return "document_processor"
    
    async def process(self, session: AsyncSession, search_space_id: int,
                     user_id: str, url: str) -> Any:
        return await add_youtube_video_document(
            session, url, search_space_id, user_id
        )
    
    def get_log_metadata(self, url: str, user_id: str, **kwargs) -> Dict[str, Any]:
        return {
            "document_type": "YOUTUBE_VIDEO",
            "url": url,
            "user_id": user_id,
        }
    
    def get_log_message(self, url: str, **kwargs) -> str:
        return f"Starting YouTube video processing for: {url}"
    
    def get_success_message(self, result) -> str:
        return f"Successfully processed YouTube video: {result.title}"
    
    def get_success_metadata(self, result) -> Dict[str, Any]:
        return {
            "document_id": result.id,
            "video_id": result.document_metadata.get("video_id"),
            "content_hash": result.content_hash,
        }


# Create and register task
youtube_task = YouTubeVideoTask()
process_youtube_video_task = youtube_task.create_celery_task()
```

**Step 3**: Update main file to re-export tasks

```python
# app/tasks/celery_tasks/document_tasks.py (refactored)

"""Celery tasks for document processing."""

import logging
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from app.config import config

logger = logging.getLogger(__name__)


def get_celery_session_maker():
    """Create async session maker for Celery tasks."""
    engine = create_async_engine(
        config.DATABASE_URL,
        poolclass=NullPool,
        echo=False,
    )
    return async_sessionmaker(engine, expire_on_commit=False)


# Import task implementations
from .document_tasks.extension_task import process_extension_document_task
from .document_tasks.youtube_task import process_youtube_video_task
from .document_tasks.file_upload_task import process_file_upload_task

__all__ = [
    "process_extension_document_task",
    "process_youtube_video_task",
    "process_file_upload_task",
    "get_celery_session_maker",
]
```

### Expected Results

**Before**:
- 270 lines in 1 file
- 3 tasks with 100% duplication
- Event loop management repeated 3 times
- Logging logic repeated 3 times

**After**:
- Base class: ~150 lines
- Extension task: ~40 lines
- YouTube task: ~40 lines
- File upload task: ~40 lines
- Main file: ~20 lines (exports)
- **Total**: ~290 lines across 5 files (but 80% less duplication)

**Benefits**:
- Add new document processors by inheriting BaseDocumentTask
- Event loop management centralized
- Logging workflow standardized
- Easier to test (mock base class methods)

---

## File 2: podcast_tasks.py (178 lines) - PRIORITY 2

**File**: `app/tasks/celery_tasks/podcast_tasks.py`  
**Lines**: 178  
**Pattern**: Single large Celery task

**Refactoring**: Similar to document_tasks.py - extract to BasePodcastTask

**Estimated time**: 1 hour

---

## File 3: document_reindex_tasks.py (184 lines) - PRIORITY 3

**File**: `app/tasks/celery_tasks/document_reindex_tasks.py`  
**Lines**: 184  
**Pattern**: Single reindex task

**Refactoring**: Extract to BaseReindexTask

**Estimated time**: 1 hour

---

## File 4: blocknote_migration_tasks.py (168 lines) - PRIORITY 4

**File**: `app/tasks/celery_tasks/blocknote_migration_tasks.py`  
**Lines**: 168  
**Pattern**: Migration task (may be temporary)

**Recommendation**: Skip refactoring if this is one-time migration code

**Estimated time**: 1 hour (if needed)

---

## File 5: schedule_checker_task.py (131 lines) - PRIORITY 5

**File**: `app/tasks/celery_tasks/schedule_checker_task.py`  
**Lines**: 131  
**Pattern**: Periodic task

**Refactoring**: Extract scheduler logic to service class

**Estimated time**: 30 min

---

## Recommended Execution Order

### Phase 1: Document Tasks (3-4 hours)

**Priority**: HIGH - Most code duplication

1. Create `BaseDocumentTask` class (1 hour)
2. Extract Extension task (30 min)
3. Extract YouTube task (30 min)
4. Extract File upload task (30 min)
5. Test all 3 tasks (1 hour)
6. Commit

### Phase 2: Podcast Tasks (1 hour)

**Priority**: MEDIUM

1. Create `BasePodcastTask` class (30 min)
2. Extract podcast generation task (30 min)
3. Test and commit

### Phase 3: Reindex Tasks (1 hour)

**Priority**: MEDIUM

1. Create `BaseReindexTask` class (30 min)
2. Extract reindex logic (30 min)
3. Test and commit

### Phase 4: Optional Tasks (1.5 hours)

**Priority**: LOW

1. Schedule checker (30 min)
2. BlockNote migration (1 hour) - Only if still needed

---

## Total Estimated Time

**Phase 1 (Must Do)**: 3-4 hours  
**Phase 2-3 (Should Do)**: 2 hours  
**Phase 4 (Optional)**: 1.5 hours

**Total**: 3-6 hours (depending on scope)

---

## Expected Impact

**Code Reduction**:
- Before: 931 lines
- After: ~500 lines across multiple files (-46%)
- Duplication: -80%

**Maintainability**:
- New document processors: Just inherit BaseDocumentTask
- Centralized error handling and logging
- Consistent task patterns
- Easier testing

**Pattern Consistency**:
- Matches already refactored files (file_processors, stream_new_chat, connector_tasks)
- All Celery tasks follow Template Method pattern

---

## Next Steps

**Recommended**: Start with Phase 1 (document_tasks.py) - highest duplication, highest impact

**Commands to start**:
```bash
cd surfsense_backend
mkdir -p app/tasks/celery_tasks/document_tasks
touch app/tasks/celery_tasks/document_tasks/__init__.py
touch app/tasks/celery_tasks/document_tasks/base.py
```

