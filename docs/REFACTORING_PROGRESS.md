# Streaming Refactoring Progress

## Phase 1: Extract Pure Functions ✅ COMPLETE

### Completed Extractions:
1. ✅ Event extractors (`event_extractors.py`)
2. ✅ Stream state (`stream_state.py`)
3. ✅ Tool handlers (9 tools in `tool_handlers/`)
4. ✅ Tool event dispatcher (`tool_event_handler.py`)
5. ✅ Context formatters (`context_formatters.py`)

**Result:** Reduced from 1,313 → 694 lines (47% reduction)

---

## Phase 2: Extract Orchestration 🔄 IN PROGRESS

### Step 1: LLM Config Loading ✅ COMPLETE

**Created:** `app/services/chat/streaming/llm_config_loader.py` (86 lines)

**Extracted:**
- Config loading logic from both `stream_new_chat` and `stream_resume_chat`
- Unified handling of YAML configs (negative IDs) and database configs (positive IDs)
- Clean error handling with `LLMConfigResult` dataclass

**Changes:**
- `stream_new_chat_v2.py`: 694 → 646 lines (48 lines removed, 7% reduction)
- Eliminated ~40 lines of duplicated code between the two functions
- Removed 5 unused imports from main file

**Files Modified:**
- Created: `app/services/chat/streaming/llm_config_loader.py`
- Updated: `app/tasks/chat/stream_new_chat_v2.py`

**Status:** ✅ Ruff passes, ready for testing

---

### Step 2: Agent Builder ✅ COMPLETE

**Created:** `app/services/chat/streaming/agent_builder.py` (73 lines)

**Extracted:**
- Agent instantiation with all dependencies
- Connector service setup
- Firecrawl API key retrieval
- Checkpointer configuration
- Thread visibility handling

**Changes:**
- `stream_new_chat_v2.py`: 646 → 610 lines (36 lines removed, 5.6% reduction)
- Eliminated ~30 lines of duplicated code between `stream_new_chat` and `stream_resume_chat`
- Removed 1 unused import (ConnectorService)

**Files Modified:**
- Created: `app/services/chat/streaming/agent_builder.py`
- Updated: `app/tasks/chat/stream_new_chat_v2.py`

**Status:** ✅ Ruff passes, ready for testing

---

### Step 3: Context Builder ✅ COMPLETE

**Created:** `app/services/chat/streaming/context_builder.py` (124 lines)

**Extracted:**
- History bootstrapping for cloned chats
- Document fetching (mentioned documents with chunks)
- SurfSense docs fetching (with chunks)
- Context formatting with existing formatters
- User message construction with @mentions
- Display name handling for search space chats

**Changes:**
- `stream_new_chat_v2.py`: 610 → 519 lines (91 lines removed, 14.9% reduction)
- Removed 4 unused imports (HumanMessage, Document, SurfsenseDocsDocument, bootstrap_history_from_db)
- Simplified initial thinking step logic (now uses IDs instead of fetched docs)

**Files Modified:**
- Created: `app/services/chat/streaming/context_builder.py`
- Updated: `app/tasks/chat/stream_new_chat_v2.py`

**Status:** ✅ Ruff passes, ready for testing

---

### Step 4: Title Generator (~40 lines) 📋 NEXT

Extract title generation logic:
- LLM-based title generation
- Title validation
- Database update

**Target file:** `title_generator.py`

---

### Step 5: Resume Handler (~40 lines) 📋 PENDING

Extract resume-specific logic:
- Resume command construction
- Decision handling

**Target file:** `resume_handler.py`

---

## Metrics Tracking

| Phase | Component | Before | After | Reduction |
|-------|-----------|--------|-------|-----------|
| 1 | `_stream_agent_events` | 645 | 133 | 79% |
| 1 | `stream_new_chat` | 1,313 | 694 | 47% |
| 2.1 | LLM Config Loading | 694 | 646 | 7% |
| 2.2 | Agent Builder | 646 | 610 | 5.6% |
| 2.3 | Context Builder | 610 | 519 | 14.9% |
| **Current Total** | **stream_new_chat_v2.py** | **1,313** | **519** | **60.5%** |

**Target after Phase 2:** ~200 lines (85% total reduction)

---

## Next Steps

1. ✅ Step 1: LLM Config Loading - **COMPLETE**
2. ✅ Step 2: Agent Builder - **COMPLETE**
3. ✅ Step 3: Context Builder - **COMPLETE**
4. 🔄 Step 4: Title Generator - **START NOW**
5. Then: Step 5 (Resume Handler)
6. Manual testing
7. Automated testing (Phase 4)
