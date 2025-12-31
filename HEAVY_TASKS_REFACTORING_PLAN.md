# Heavy Tasks Refactoring Plan

**Date**: 2024-12-31  
**Priority**: Long-running background tasks (document processing, chat streaming, indexing)  
**Total Lines**: 2,818 lines across 3 major files

---

## Overview

These files handle the heaviest, longest-running operations in the backend:
1. **Document Processing** - File uploads, ETL services (1,069 lines)
2. **Chat Streaming** - Real-time LLM responses (1,061 lines)
3. **Connector Indexing** - Background Celery tasks (688 lines)

---

## File 1: file_processors.py (1,069 lines)

### Current Structure
```
app/tasks/document_processors/file_processors.py
├── add_received_file_document_using_unstructured() - 130 lines
├── add_received_file_document_using_llamacloud() - 131 lines
├── add_received_file_document_using_docling() - 154 lines
└── process_file_in_background() - 617 lines (HUGE!)
```

### Problem
- 4 massive async functions (130-617 lines each)
- 90% code duplication across ETL service handlers
- process_file_in_background() is a 617-line god function
- All 3 ETL services follow identical pattern but duplicated

### Refactoring Strategy

#### Phase 1: Extract Base Processor Class
```python
# app/tasks/document_processors/base_file_processor.py
class BaseFileProcessor:
    """Base class for all file processing strategies."""
    
    def __init__(self, session, user_id, search_space_id):
        self.session = session
        self.user_id = user_id
        self.search_space_id = search_space_id
    
    async def process_document(self, file_name: str, content: str) -> Document:
        """Template method - defines the processing workflow."""
        # 1. Generate hashes
        unique_hash = self._generate_unique_hash(file_name)
        content_hash = self._generate_content_hash(content)
        
        # 2. Check for existing document
        existing_doc = await self._check_existing_document(unique_hash)
        if existing_doc and existing_doc.content_hash == content_hash:
            return existing_doc
        
        # 3. Generate summary (subclass-specific)
        summary, embedding = await self._generate_summary(file_name, content)
        
        # 4. Process chunks
        chunks = await self._create_chunks(content)
        
        # 5. Convert to BlockNote
        blocknote = await self._convert_to_blocknote(content)
        
        # 6. Save document
        return await self._save_document(existing_doc, file_name, summary, ...)
    
    # Abstract methods for subclasses
    async def _generate_summary(self, file_name, content):
        raise NotImplementedError
```

#### Phase 2: Create ETL Service Processors
```
app/tasks/document_processors/etl/
├── __init__.py
├── unstructured_processor.py    # ~80 lines
├── llamacloud_processor.py      # ~80 lines
└── docling_processor.py         # ~90 lines
```

Each processor:
```python
class UnstructuredFileProcessor(BaseFileProcessor):
    async def _generate_summary(self, file_name, content):
        # Unstructured-specific logic
        document_metadata = {
            "file_name": file_name,
            "etl_service": "UNSTRUCTURED",
            "document_type": "File Document",
        }
        return await generate_document_summary(content, self.user_llm, document_metadata)
```

#### Phase 3: Extract File Type Handlers
```
app/tasks/document_processors/handlers/
├── __init__.py
├── markdown_handler.py          # ~100 lines
├── audio_handler.py             # ~150 lines
├── video_handler.py             # ~120 lines
├── image_handler.py             # ~80 lines
└── generic_handler.py           # ~100 lines
```

#### Phase 4: Simplify Main Function
```python
# app/tasks/document_processors/file_processors.py (final ~150 lines)

async def process_file_in_background(...):
    # 1. Detect file type
    file_type = detect_file_type(filename)
    
    # 2. Get appropriate handler
    handler = FILE_TYPE_HANDLERS.get(file_type, GenericHandler)
    
    # 3. Process using handler
    result = await handler.process(file_path, filename, ...)
    
    return result
```

### Expected Outcome
- **Before**: 1,069 lines in 1 file
- **After**: ~800 lines across 13 files
  - base_file_processor.py: ~150 lines
  - 3 ETL processors: ~240 lines
  - 5 file type handlers: ~550 lines
  - Main file: ~150 lines

---

## File 2: stream_new_chat.py (1,061 lines)

### Current Structure
```
app/tasks/chat/stream_new_chat.py
├── format_attachments_as_context() - 17 lines
├── format_mentioned_documents_as_context() - 21 lines
├── extract_todos_from_deepagents() - 24 lines
└── stream_new_chat() - 962 lines (MASSIVE GOD FUNCTION!)
```

### Problem
- One 962-line async function doing EVERYTHING
- Mix of responsibilities:
  - Attachment handling
  - Document retrieval
  - LangGraph agent setup
  - Streaming logic
  - Response parsing
  - Error handling

### Refactoring Strategy

#### Phase 1: Extract Context Builders
```
app/tasks/chat/context/
├── __init__.py
├── attachment_context.py        # ~50 lines
├── document_context.py          # ~80 lines
└── system_context.py            # ~60 lines
```

#### Phase 2: Extract Agent Configuration
```
app/tasks/chat/agents/
├── __init__.py
├── agent_factory.py             # ~120 lines
├── agent_config.py              # ~80 lines
└── checkpointer_manager.py      # ~70 lines
```

#### Phase 3: Extract Streaming Logic
```
app/tasks/chat/streaming/
├── __init__.py
├── stream_handler.py            # ~150 lines
├── response_parser.py           # ~100 lines
└── event_emitter.py             # ~80 lines
```

#### Phase 4: Extract Response Processing
```
app/tasks/chat/response/
├── __init__.py
├── message_formatter.py         # ~80 lines
├── citation_processor.py        # ~70 lines
└── metadata_extractor.py        # ~60 lines
```

#### Phase 5: Simplified Main Function
```python
# app/tasks/chat/stream_new_chat.py (final ~200 lines)

async def stream_new_chat(...):
    # 1. Build context
    context = await ContextBuilder.build(attachments, mentioned_docs, ...)
    
    # 2. Configure agent
    agent = await AgentFactory.create_agent(user, search_space, context)
    
    # 3. Stream responses
    async for event in StreamHandler.stream_events(agent, input_message):
        yield event
    
    # 4. Process final response
    final_response = await ResponseProcessor.process(events, metadata)
    yield final_response
```

### Expected Outcome
- **Before**: 1,061 lines in 1 file
- **After**: ~900 lines across 14 files
  - Context builders: ~190 lines
  - Agent config: ~270 lines
  - Streaming logic: ~330 lines
  - Response processing: ~210 lines
  - Main file: ~200 lines

---

## File 3: connector_tasks.py (688 lines)

### Current Structure
```
app/tasks/celery_tasks/connector_tasks.py
├── 15 Celery task wrappers (@celery_app.task decorators)
├── 15 async implementation functions (_index_* functions)
└── Repeated pattern for each connector
```

### Problem
- Massive code duplication across 15 connectors
- Each connector has identical wrapper pattern:
  ```python
  @celery_app.task(name="index_X", bind=True)
  def index_X_task(self, ...):
      loop = asyncio.new_event_loop()
      result = loop.run_until_complete(_index_X(...))
      return result
  
  async def _index_X(...):
      # Actual implementation
  ```

### Refactoring Strategy

#### Phase 1: Extract Base Task Class
```python
# app/tasks/celery_tasks/base_connector_task.py (~120 lines)

class BaseConnectorTask:
    """Base class for all connector indexing tasks."""
    
    def __init__(self, connector_id, search_space_id):
        self.connector_id = connector_id
        self.search_space_id = search_space_id
    
    async def execute(self):
        """Template method for connector indexing."""
        # 1. Get connector config
        connector = await self._get_connector()
        
        # 2. Initialize indexer
        indexer = await self._create_indexer(connector)
        
        # 3. Index documents
        result = await indexer.index_all()
        
        # 4. Log results
        await self._log_results(result)
        
        return result
    
    # Abstract methods
    async def _create_indexer(self, connector):
        raise NotImplementedError
```

#### Phase 2: Create Connector Task Classes
```
app/tasks/celery_tasks/tasks/
├── __init__.py
├── slack_task.py               # ~35 lines
├── notion_task.py              # ~35 lines
├── github_task.py              # ~35 lines
├── linear_task.py              # ~35 lines
├── jira_task.py                # ~35 lines
├── confluence_task.py          # ~35 lines
├── clickup_task.py             # ~35 lines
├── google_calendar_task.py     # ~35 lines
├── airtable_task.py            # ~35 lines
├── google_gmail_task.py        # ~35 lines
├── discord_task.py             # ~35 lines
├── luma_task.py                # ~35 lines
├── elasticsearch_task.py       # ~35 lines
├── crawled_urls_task.py        # ~35 lines
└── bookstack_task.py           # ~35 lines
```

#### Phase 3: Task Factory & Registry
```python
# app/tasks/celery_tasks/task_factory.py (~80 lines)

CONNECTOR_TASK_REGISTRY = {
    "SLACK_CONNECTOR": SlackIndexingTask,
    "NOTION_CONNECTOR": NotionIndexingTask,
    # ... all 15 connectors
}

def create_task_wrapper(task_name: str, task_class: Type[BaseConnectorTask]):
    """Factory to create Celery task wrappers dynamically."""
    
    @celery_app.task(name=task_name, bind=True)
    def wrapper(self, connector_id, search_space_id, **kwargs):
        loop = asyncio.new_event_loop()
        task = task_class(connector_id, search_space_id)
        result = loop.run_until_complete(task.execute())
        loop.close()
        return result
    
    return wrapper

# Register all tasks dynamically
for connector_type, task_class in CONNECTOR_TASK_REGISTRY.items():
    task_name = f"index_{connector_type.lower()}"
    create_task_wrapper(task_name, task_class)
```

#### Phase 4: Simplified Main File
```python
# app/tasks/celery_tasks/connector_tasks.py (final ~150 lines)

from .base_connector_task import BaseConnectorTask
from .task_factory import CONNECTOR_TASK_REGISTRY, register_all_tasks

# Register all connector tasks
register_all_tasks()

# Expose task functions for backward compatibility
index_slack_messages_task = celery_app.tasks["index_slack_connector"]
index_notion_pages_task = celery_app.tasks["index_notion_connector"]
# ... etc
```

### Expected Outcome
- **Before**: 688 lines in 1 file
- **After**: ~780 lines across 18 files
  - base_connector_task.py: ~120 lines
  - 15 connector tasks: ~525 lines (35 each)
  - task_factory.py: ~80 lines
  - Main file: ~150 lines

---

## Overall Impact Summary

### Total Reduction
- **Before**: 2,818 lines in 3 files
- **After**: ~2,480 lines in 45 files
- **Line reduction**: 12% (but massive improvement in maintainability)

### Key Benefits
1. **Testability**: Each processor/handler/task can be unit tested independently
2. **Maintainability**: Single Responsibility Principle - one class, one job
3. **Extensibility**: Adding new ETL service = one new 80-line file
4. **Code reuse**: Shared logic in base classes (Template Method pattern)
5. **Performance**: No change (refactoring for structure, not speed)

### Implementation Order
1. **Phase 1** (4-5 hours): file_processors.py
2. **Phase 2** (5-6 hours): stream_new_chat.py
3. **Phase 3** (3-4 hours): connector_tasks.py

**Total estimated time**: 12-15 hours

---

## Testing Strategy

### After Each Phase
1. Run existing tests (if any)
2. Verify imports work: `python -c "from app.tasks.document_processors.file_processors import process_file_in_background"`
3. Manual integration test:
   - Upload a test file
   - Start a chat conversation
   - Trigger connector indexing

### New Tests to Add
1. Unit tests for each processor/handler (target: 60% coverage)
2. Integration tests for file upload workflow
3. Mock tests for Celery tasks
4. End-to-end test: upload → process → chat → response

---

**Ready to start implementation!** 🚀
