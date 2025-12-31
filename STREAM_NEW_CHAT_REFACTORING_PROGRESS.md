# Stream New Chat Refactoring Progress

**File**: `surfsense_backend/app/tasks/chat/stream_new_chat.py`  
**Original Size**: 1,061 lines  
**Current Size**: 1,004 lines  
**Reduction**: 57 lines (5% so far)  
**Target**: ~200 lines (79% reduction when complete)

---

## Phase 1: Context Builders ✅ COMPLETE

**Status**: Extracted and committed (commit: `9eb75c28`)

### Created Modules
1. `app/tasks/chat/context/__init__.py` (13 lines)
2. `app/tasks/chat/context/attachment_formatter.py` (20 lines)
3. `app/tasks/chat/context/document_formatter.py` (26 lines)
4. `app/tasks/chat/context/todo_extractor.py` (27 lines)

**Total extracted**: 86 lines across 4 files  
**Removed from main**: 57 lines (includes docstrings)

### What Was Extracted
- `format_attachments_as_context()` - Formats ChatAttachment objects as XML context
- `format_mentioned_documents_as_context()` - Formats mentioned Document objects as XML
- `extract_todos_from_deepagents()` - Extracts todos from Command/dict outputs


## Phase 2-5: Remaining Work (Estimated 4-5 hours)

### Phase 2: Agent Configuration (1.5 hours)
Extract LLM config loading, agent setup, and connector service initialization.

### Phase 3: Streaming Logic (2-3 hours) - MOST COMPLEX
Extract 540+ lines of event handling logic (on_chat_model_stream, on_tool_start, on_tool_end).

### Phase 4: Response Processing (45 min)
Extract tool output formatting logic.

### Phase 5: Main Function Refactoring (30 min)
Simplify main function to ~200 lines using all extracted modules.

## Current Progress: 17% Complete

Remaining phases detailed in HEAVY_TASKS_REFACTORING_PLAN.md.

