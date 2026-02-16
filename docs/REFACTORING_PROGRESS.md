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

### Step 3: Message Builder (~60 lines) 📋 NEXT

Extract context fetching and message building:
- Document fetching (mentioned documents)
- SurfSense docs fetching
- Context formatting
- Message construction with @mentions

**Target:** Extend `context_formatters.py` or create `message_builder.py`

---

### Step 4: Title Generator (~40 lines) 📋 PENDING

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
| **Current Total** | **stream_new_chat_v2.py** | **1,313** | **610** | **53.5%** |

**Target after Phase 2:** ~200 lines (85% total reduction)

---

## Next Steps

1. ✅ Step 1: LLM Config Loading - **COMPLETE**
2. ✅ Step 2: Agent Builder - **COMPLETE**
3. 🔄 Step 3: Message Builder - **START NOW**
4. Then: Steps 4-5
5. Manual testing
6. Automated testing (Phase 4)
