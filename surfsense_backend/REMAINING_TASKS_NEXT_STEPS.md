# Remaining Heavy Tasks - Next Steps

**Date**: December 31, 2024  
**Status**: document_tasks.py refactoring COMPLETE ✅  
**Time Spent**: 3-4 hours  
**Lines Refactored**: 270 → 493 lines (0% duplication)

---

## What's Been Completed ✅

### Phase 1: Core Long-Running Tasks (All Done!)

| File | Before | After | Reduction | Pattern | Status |
|------|--------|-------|-----------|---------|--------|
| file_processors.py | 1,069 | 654 | -39% | Template Method | ✅ DONE |
| stream_new_chat.py | 1,061 | 221 | -79% | Facade + State | ✅ DONE |
| connector_tasks.py | 688 | 567 | -18% | Template Method | ✅ DONE |
| document_tasks.py | 270 | 493 | +82%* | Template Method | ✅ DONE |

*Total lines increased but duplication eliminated (238 lines of duplicated code removed)

**Total Refactored**: 3,088 → 1,935 lines (-37%, -1,153 lines)  
**Files Created**: 50+ modular files  
**Duplication Eliminated**: ~1,500 lines

---

## What's Remaining (661 lines)

### Priority 1: document_reindex_tasks.py (184 lines) - 1-2 hours

**File**: app/tasks/celery_tasks/document_reindex_tasks.py  
**Lines**: 184  
**Pattern**: Single reindex task with complex workflow

**Current Structure**:
```
@celery_app.task(name="reindex_document", bind=True)
def reindex_document_task(document_id, user_id):
    # Event loop setup (8 lines)
    loop = asyncio.new_event_loop()
    ...

async def _reindex_document(document_id, user_id):
    # Session setup (5 lines)
    async with get_celery_session_maker()() as session:
        # Task logging setup (10 lines)
        task_logger = TaskLoggingService(...)
        log_entry = await task_logger.log_task_start(...)
        
        try:
            # Complex reindex workflow (130 lines):
            # 1. Load document with chunks
            # 2. Convert BlockNote → Markdown
            # 3. Delete old chunks
            # 4. Create new chunks
            # 5. Regenerate summary with LLM
            # 6. Update document embedding
            # 7. Commit changes
            
            await task_logger.log_task_success(...)
        except SQLAlchemyError as db_error:
            # DB error handling (10 lines)
        except Exception as e:
            # Generic error handling (10 lines)
```

**Refactoring Strategy**:
- **Option A**: Keep as-is (single complex task, hard to test)
- **Option B**: Extract workflow steps to separate service class:
  ```
  class DocumentReindexService:
      async def reindex_document(session, document_id, user_id):
          # 1. Load document
          document = await self._load_document(session, document_id)
          # 2. Convert to markdown
          markdown = await self._convert_to_markdown(document)
          # 3. Delete old chunks
          await self._delete_old_chunks(session, document_id)
          # 4. Create new chunks
          new_chunks = await self._create_chunks(markdown, document_id)
          # 5. Regenerate summary
          summary = await self._generate_summary(session, document, markdown, user_id)
          # 6. Update document
          await self._update_document(document, summary, new_chunks)
  ```
- **Recommended**: Option B (service class) - more testable, reusable

**Benefits**:
- Each step can be unit tested independently
- Reindex logic can be reused from API routes
- Clear separation of concerns

**Time**: 1-2 hours

---

### Priority 2: podcast_tasks.py (178 lines) - 1 hour

**File**: app/tasks/celery_tasks/podcast_tasks.py  
**Lines**: 178  
**Pattern**: Single podcast generation task with complex LangGraph workflow

**Current Structure**:
```
@celery_app.task(name="generate_content_podcast", bind=True)
def generate_content_podcast_task(source_content, search_space_id, podcast_title, user_prompt):
    # Event loop setup (8 lines)
    loop = asyncio.new_event_loop()
    ...

async def _generate_content_podcast(...):
    # Session setup (5 lines)
    async with get_celery_session_maker()() as session:
        # Create podcast record (10 lines)
        podcast = Podcast(...)
        
        try:
            # LangGraph workflow (100 lines):
            # 1. Build initial state
            # 2. Stream graph events
            # 3. Track progress (writing_outline, generating_audio, etc.)
            # 4. Update podcast status
            # 5. Handle errors
            
            # Finalize podcast (20 lines)
            podcast.status = "completed"
            await session.commit()
        except Exception as e:
            # Error handling (20 lines)
            podcast.status = "failed"
            await session.commit()
        finally:
            # Redis cleanup (10 lines)
```

**Refactoring Strategy**:
- Extract podcast workflow to service class
- Keep Celery task as thin wrapper

**Benefits**:
- Podcast generation logic reusable from API
- Testable without Celery
- Clear separation of orchestration vs business logic

**Time**: 1 hour

---

### Priority 3: schedule_checker_task.py (131 lines) - 30 min

**File**: app/tasks/celery_tasks/schedule_checker_task.py  
**Lines**: 131  
**Pattern**: Periodic task checking connector sync schedules

**Current Structure**:
```
@celery_app.task(name="check_connector_schedules")
def check_connector_schedules():
    # Event loop setup (8 lines)
    loop = asyncio.new_event_loop()
    ...

async def _check_connector_schedules():
    # Session setup (5 lines)
    async with get_celery_session_maker()() as session:
        # Load search spaces with connectors (15 lines)
        search_spaces = await session.execute(...)
        
        for space in search_spaces:
            for connector in space.connectors:
                # Check if sync needed (30 lines)
                if should_sync(connector):
                    # Trigger index task (10 lines)
                    index_connector_task.delay(...)
```

**Refactoring Strategy**:
- Extract schedule logic to ScheduleService
- Keep task as thin wrapper

**Time**: 30 min

---

### Priority 4: blocknote_migration_tasks.py (168 lines) - SKIP?

**File**: app/tasks/celery_tasks/blocknote_migration_tasks.py  
**Lines**: 168  
**Pattern**: One-time migration task

**Recommendation**: SKIP refactoring if this is temporary migration code

**If needed**: 1 hour

---

## Recommended Execution Plan

### Next Session (2-3 hours):

1. **Refactor document_reindex_tasks.py** (1-2 hours)
   - Extract DocumentReindexService
   - Break reindex workflow into 6 testable methods
   - Update Celery task to use service
   
2. **Refactor podcast_tasks.py** (1 hour)
   - Extract PodcastGenerationService
   - Keep LangGraph workflow logic separate
   - Update Celery task to use service

3. **Refactor schedule_checker_task.py** (30 min)
   - Extract ScheduleCheckerService
   - Simple extraction, minimal logic

### Total Time: 2.5-3.5 hours

---

## After All Refactoring (Projected)

### Overall Stats:

**Before**: 3,749 lines (3,088 core tasks + 661 remaining)
**After**: ~2,500 lines across 70+ files
**Reduction**: -33% lines, -90% duplication

### Files Structure:
```
app/tasks/
├── document_processors/
│   ├── base_file_processor.py
│   ├── etl/  (3 files)
│   └── file_processors.py
├── chat/
│   ├── context/  (3 files)
│   ├── config/  (3 files)
│   ├── streaming/  (3 files)
│   └── stream_new_chat.py
└── celery_tasks/
    ├── connectors/  (17 files)
    ├── document_tasks/  (5 files)
    ├── services/  (NEW - 3 services)
    │   ├── document_reindex_service.py
    │   ├── podcast_generation_service.py
    │   └── schedule_checker_service.py
    └── (thin Celery task wrappers)
```

### Benefits:

✅ **Testability**: Every service method can be unit tested  
✅ **Reusability**: Services used from API routes + Celery tasks  
✅ **Maintainability**: Clear single responsibility per file  
✅ **Consistency**: All tasks follow same pattern  
✅ **Scalability**: Easy to add new tasks/services

---

## User Decision Point

**Question**: Continue with remaining 3 files (2.5-3.5 hours)?

**Option A**: YES - Complete all heavy task refactoring
- Pro: Full consistency across codebase
- Pro: All long-running tasks modernized
- Con: 2.5-3.5 more hours

**Option B**: NO - Stop here, move to other priorities
- Pro: Core tasks already done (3,088 lines refactored)
- Pro: Can tackle frontend, infrastructure, or testing
- Con: 3 files still using old pattern

**Recommendation**: Option A (finish strong) - only 2.5-3.5 hours remaining

