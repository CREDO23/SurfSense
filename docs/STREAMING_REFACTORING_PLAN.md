# SurfSense Streaming System: Refactoring & Testing Plan

**Version:** 1.0  
**Date:** February 2026  
**Status:** Planning Phase  
**Owner:** Engineering Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Problems & Challenges](#problems--challenges)
4. [Proposed Architecture](#proposed-architecture)
5. [Refactoring Strategy](#refactoring-strategy)
6. [Week-by-Week Implementation Plan](#week-by-week-implementation-plan)
7. [Testing Strategy](#testing-strategy)
8. [Success Metrics](#success-metrics)
9. [Risk Assessment](#risk-assessment)
10. [Appendices](#appendices)

---

## Executive Summary

### Overview

This document outlines a comprehensive 6-week plan to refactor and test the SurfSense streaming system. The streaming system is the core of the user experience, handling real-time AI responses, tool execution visualization, and event streaming to the frontend.

### Current Challenges

- **Complexity**: `_stream_agent_events()` is 645 lines with 10+ responsibilities
- **Testability**: 0 tests currently, tightly coupled code makes testing difficult
- **Maintainability**: Hard to add new tools or modify behavior
- **Reliability**: No way to catch regressions before production

### Goals

1. **Extract** pure functions for 100% testability
2. **Reduce** complexity by 70-80%
3. **Add** 150+ comprehensive tests
4. **Integrate** CI/CD pipeline
5. **Enable** rapid feature development

### Outcomes

- **90%+ test coverage** of streaming code
- **< 2 minutes** CI test execution
- **155+ tests** catching regressions
- **70% code reduction** in core functions
- **Clear patterns** for team to follow

---

## Current State Analysis

### File Structure

```
surfsense_backend/app/
├── services/
│   └── new_streaming_service.py        # 811 lines - Protocol layer ✅
├── tasks/chat/
│   └── stream_new_chat.py              # 1,313 lines
│       ├── format_mentioned_documents_as_context()    # 65 lines ✅
│       ├── format_mentioned_surfsense_docs_as_context() # 46 lines ✅
│       ├── extract_todos_from_deepagents()            # 22 lines ✅
│       ├── _stream_agent_events()                     # 645 lines ❌
│       ├── stream_new_chat()                          # 370 lines ❌
│       └── stream_resume_chat()                       # ~115 lines ❌
```

### Code Metrics

| Component | Lines | Complexity | Test Coverage |
|-----------|-------|------------|---------------|
| `VercelStreamingService` | 811 | Low (mostly pure) | 0% |
| `_stream_agent_events()` | 645 | **Very High** | 0% |
| `stream_new_chat()` | 370 | **High** | 0% |
| `stream_resume_chat()` | 115 | Medium | 0% |
| **Total** | **1,941** | - | **0%** |

### Key Components

#### 1. Protocol Layer (Good State)

**File**: `app/services/new_streaming_service.py`

**Status**: ✅ **95% Pure** - Already well-structured

```python
class VercelStreamingService:
    # Pure SSE formatting methods
    def format_text_delta(self, text_id: str, delta: str) -> str
    def format_tool_input_start(self, tool_call_id: str, tool_name: str) -> str
    def format_thinking_step(self, step_id: str, title: str, status: str) -> str
    # ... 30+ more formatting methods
```

**Characteristics**:
- Pure functions (no I/O)
- Deterministic output
- Easy to test
- No external dependencies

#### 2. Event Processing (Needs Major Refactoring)

**File**: `app/tasks/chat/stream_new_chat.py`

**Function**: `_stream_agent_events()` - **645 lines**

**Status**: ❌ **Too Complex** - Multiple responsibilities

**Responsibilities** (should be separated):
1. Event parsing from LangGraph
2. State management (text blocks, tool execution, steps)
3. Tool-specific display logic (15+ tools)
4. SSE formatting
5. Error handling
6. Interrupt detection
7. Thinking step management

**Example of tight coupling**:
```python
# Lines 290-340: Tool-specific logic mixed with event handling
elif event_type == "on_tool_start":
    tool_name = event.get("name", "unknown_tool")
    run_id = event.get("run_id", "")
    tool_input = event.get("data", {}).get("input", {})
    
    if tool_name == "search_knowledge_base":
        query = tool_input.get("query", "")
        last_active_step_title = "Searching knowledge base"
        last_active_step_items = [f"Query: {query[:100]}"]
        yield streaming_service.format_thinking_step(...)
    elif tool_name == "link_preview":
        url = tool_input.get("url", "")
        last_active_step_title = "Fetching link preview"
        last_active_step_items = [f"URL: {url[:80]}"]
        yield streaming_service.format_thinking_step(...)
    # ... 10+ more tools with similar patterns
```

#### 3. Orchestration (Needs Refactoring)

**Function**: `stream_new_chat()` - **370 lines**

**Status**: ❌ **Too Many Responsibilities**

**Current responsibilities**:
1. Load LLM configuration
2. Create services (connector, checkpointer)
3. Create agent
4. Fetch mentioned documents
5. Build context
6. Format input
7. Start streaming
8. Handle errors
9. Manage session state

---

## Problems & Challenges

### Problem 1: Untestable Code

**Impact**: Cannot verify correctness, catch regressions, or refactor safely

**Example**:
```python
# How do you test this?
embedding_model = config.embedding_model_instance  # Global access
query_embedding = embedding_model.embed(query_text)  # Slow, non-deterministic

# Mixed with complex SQL
query = (
    select(Chunk)
    .join(Document)
    .where(Document.search_space_id == search_space_id)
    .order_by(Chunk.embedding.op("<=>")(query_embedding))
)
```

### Problem 2: Tight Coupling

**Impact**: Changes in one area break others, hard to understand

**Issues**:
- Global config access (`config.embedding_model_instance`)
- No dependency injection
- Mixed concerns (DB + logic + formatting)
- Hard-coded dependencies

### Problem 3: Non-Determinism

**Impact**: Cannot write reliable tests

**Sources**:
- LLM responses vary
- Agent events are unpredictable
- Timing-dependent behavior
- External API calls

### Problem 4: Code Duplication

**Impact**: 15+ tools with similar patterns, hard to maintain

**Example**:
```python
# Repeated 15+ times with slight variations
if tool_name == "search_knowledge_base":
    query = tool_input.get("query", "")
    last_active_step_title = "Searching knowledge base"
    last_active_step_items = [f"Query: {query[:100]}"]
elif tool_name == "scrape_webpage":
    url = tool_input.get("url", "")
    last_active_step_title = "Scraping webpage"
    last_active_step_items = [f"URL: {url[:80]}"]
# ... repeated pattern
```

### Problem 5: State Management Complexity

**Impact**: Hard to track state, easy to introduce bugs

**Issues**:
- State spread across multiple variables
- No clear state machine
- Transitions not explicit
- Easy to get into invalid states

**Example**:
```python
# State scattered across 10+ variables
current_text_id: str | None = None
thinking_step_counter = 1
tool_step_ids: dict[str, str] = {}
completed_step_ids: set[str] = set()
last_active_step_id: str | None = None
last_active_step_title: str = ""
last_active_step_items: list[str] = []
just_finished_tool: bool = False
```

---

## Proposed Architecture

### Design Principles

1. **Separation of Concerns**: Each module has one responsibility
2. **Pure Functions First**: Extract all testable logic
3. **Dependency Injection**: No global state
4. **Explicit State Machine**: Clear state transitions
5. **Protocol-First**: SSE compliance is critical

### Target Architecture

```
surfsense_backend/app/
├── services/chat/streaming/
│   ├── __init__.py
│   ├── protocol.py                     # SSE formatting (existing, rename)
│   ├── event_transformers.py          # Pure event parsing
│   ├── tool_handlers.py                # Tool-specific display logic
│   ├── state_machine.py                # Stream state management
│   └── validators.py                   # Protocol validation
│   ├── event_processor.py              # Event loop logic
│   ├── context_builder.py              # Document context formatting
│   ├── orchestrator.py                 # Main stream flow
│   └── resume_handler.py               # Resume logic
│
└── tests/chat/streaming/
    ├── __init__.py
    ├── conftest.py                     # Shared fixtures
    ├── unit/
    │   ├── test_protocol.py
    │   ├── test_event_transformers.py
    │   ├── test_tool_handlers.py
    │   ├── test_state_machine.py
    │   └── test_validators.py
    ├── integration/
    │   ├── test_event_processor.py
    │   └── test_orchestrator.py
    └── fixtures/
        ├── agent_events.py
        └── mock_agents.py
```

### Module Responsibilities

#### 1. Event Transformers (Pure)

**Purpose**: Parse LangGraph events into normalized format

**File**: `app/services/streaming/event_transformers.py`

```python
@dataclass
class TransformedEvent:
    event_type: str  # 'text', 'tool_start', 'tool_end'
    tool_name: str | None = None
    data: dict[str, Any] | None = None
    should_emit: bool = True
    should_complete_step: bool = False

def transform_chat_model_stream(event: dict) -> TransformedEvent:
    """Pure function - transform chat stream event."""
    chunk = event.get("data", {}).get("chunk")
    if not chunk or not hasattr(chunk, "content"):
        return TransformedEvent("text", should_emit=False)
    return TransformedEvent("text", data={"delta": chunk.content})

# Similar pure functions for all event types
```

**Benefits**:
- 100% testable
- No I/O
- Deterministic
- < 1ms per test

#### 2. Tool Handlers (Pure)

**Purpose**: Generate tool display information

**File**: `app/services/streaming/tool_handlers.py`

```python
@dataclass
class ToolDisplayInfo:
    step_title: str
    items: list[str]
    success_message: str | None = None
    error_message: str | None = None

def build_search_knowledge_base_display(
    tool_input: dict,
    tool_output: dict | None = None,
    status: str = "in_progress"
) -> ToolDisplayInfo:
    """Pure function - format search tool display."""
    query = tool_input.get("query", "")
    
    if status == "in_progress":
        return ToolDisplayInfo(
            step_title="Searching knowledge base",
            items=[f"Query: {query[:100]}"]
        )
    # ... handle completed state
```

**Benefits**:
- All 15+ tools testable
- Consistent interface
- Easy to add new tools
- No duplication

#### 3. State Machine (Pure)

**Purpose**: Manage stream state transitions

**File**: `app/services/streaming/state_machine.py`

```python
class StreamPhase(Enum):
    NOT_STARTED = "not_started"
    MESSAGE_STARTED = "message_started"
    TEXT_STREAMING = "text_streaming"
    TOOL_EXECUTING = "tool_executing"
    FINISHED = "finished"

@dataclass
class StreamState:
    phase: StreamPhase = StreamPhase.NOT_STARTED
    active_text_id: str | None = None
    accumulated_text: str = ""
    step_count: int = 0
    # ... other state
    
    def start_text_block(self, text_id: str) -> None:
        """Explicit state transition with validation."""
        assert self.active_text_id is None
        assert self.phase == StreamPhase.STEP_STARTED
        self.active_text_id = text_id
        self.phase = StreamPhase.TEXT_STREAMING
```

**Benefits**:
- Deterministic state transitions
- Invalid states prevented
- Easy to test all paths
- Clear lifecycle

#### 4. Event Processor (Simplified)

**Purpose**: Process agent events using extracted components

**File**: `app/tasks/chat/streaming/event_processor.py`

```python
async def process_agent_events(
    agent: Any,
    config: dict,
    streaming_service: VercelStreamingService,
    stream_state: StreamState,
) -> AsyncGenerator[str, None]:
    """
    Simplified event processor - now ~150 lines vs 645.
    """
    async for event in agent.astream_events(input_data, config=config):
        # 1. Transform event (pure function)
        transformed = transform_event(event)
        
        # 2. Handle by type
        if transformed.event_type == "text":
            async for sse in _handle_text_event(
                transformed, streaming_service, stream_state
            ):
                yield sse
        elif transformed.event_type == "tool_start":
            async for sse in _handle_tool_start(
                transformed, streaming_service, stream_state
            ):
                yield sse
        # ... clear, simple delegation
```

**Benefits**:
- **645 lines → 150 lines** (77% reduction)
- Clear separation
- Each handler is testable
- Easy to understand

#### 5. Orchestrator (Simplified)

**Purpose**: High-level streaming flow

**File**: `app/tasks/chat/streaming/orchestrator.py`

```python
async def stream_chat(
    user_query: str,
    search_space_id: int,
    chat_id: int,
    session: AsyncSession,
    # ... other params
) -> AsyncGenerator[str, None]:
    """
    Simplified orchestrator - now ~100 lines vs 370.
    """
    # 1. Load config
    agent_config = await load_agent_config(...)
    
    # 2. Create services
    agent = await create_surfsense_deep_agent(...)
    
    # 3. Build context
    context = await build_context(...)
    
    # 4. Stream events
    async for sse in process_agent_events(
        agent, config, streaming_service, stream_state
    ):
        yield sse
```

**Benefits**:
- **370 lines → 100 lines** (73% reduction)
- Clear flow
- Easy to modify
- Testable with mocks

### Dependency Flow

```
┌─────────────────────────────────────────────────┐
│           Frontend (TypeScript)                 │
│         Consumes SSE stream                     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         Orchestrator (stream_chat)              │
│   - Loads config                                │
│   - Creates agent                               │
│   - Manages high-level flow                     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│      Event Processor (process_agent_events)     │
│   - Consumes LangGraph events                   │
│   - Delegates to handlers                       │
│   - Uses state machine                          │
└────┬──────────┬─────────────┬──────────────┬────┘
     │          │             │              │
     ▼          ▼             ▼              ▼
┌─────────┐ ┌──────┐ ┌─────────────┐ ┌─────────────┐
│  Event  │ │ Tool │ │   State     │ │  Protocol   │
│Transform│ │Handle│ │   Machine   │ │  Formatter  │
│  (Pure) │ │(Pure)│ │   (Pure)    │ │   (Pure)    │
└─────────┘ └──────┘ └─────────────┘ └─────────────┘
```

### Data Flow Example

**User Query** → **Orchestrator** → **Event Processor**

```
1. User: "What is machine learning?"

2. Orchestrator:
   - Creates agent with LLM
   - Builds input with context
   - Calls event processor

3. Event Processor:
   - Receives: on_tool_start event
   - Transforms: → TransformedEvent(type="tool_start", tool_name="search_kb")
   - Gets display: → ToolDisplayInfo(title="Searching...", items=[...])
   - Updates state: → stream_state.start_tool_execution(...)
   - Formats SSE: → streaming_service.format_thinking_step(...)
   - Yields: "data: {...}\n\n"

4. Frontend:
   - Receives SSE event
   - Renders thinking step
   - Updates UI
```

---

## Refactoring Strategy

### Core Principles

1. **Extract, Don't Rewrite**: Pull out pure logic first
2. **Test Before Refactor**: Write characterization tests
3. **Incremental Changes**: Small, safe steps
4. **Parallel Development**: Old code stays until new is tested
5. **No Behavior Changes**: Keep functionality identical

### Refactoring Phases

#### Phase 1: Extract Pure Functions
**Goal**: Get 80%+ of logic into testable functions

**Approach**:
1. Identify pure logic (no I/O, deterministic)
2. Extract to new files
3. Write comprehensive tests
4. Verify 100% coverage

**Risk**: Low (not changing behavior)

#### Phase 2: Dependency Injection
**Goal**: Make dependencies mockable

**Approach**:
1. Create interfaces/protocols
2. Change functions to accept dependencies
3. Update call sites

**Risk**: Low (backward compatible)

#### Phase 3: Simplify Complex Functions
**Goal**: Break down 645-line monster

**Approach**:
1. Use extracted pure functions
2. Delegate to specialized handlers
3. Remove duplication

**Risk**: Medium (behavior might change)

#### Phase 4: Integration & Testing
**Goal**: Verify everything works together

**Approach**:
1. Create mock agents
2. Write integration tests
3. Test happy path + edge cases

**Risk**: Low (tests catch issues)

### Migration Strategy

**Parallel Development**:
```python
# Keep old code working
# app/tasks/chat/stream_new_chat.py (existing)

# Create new code alongside
# app/tasks/chat/streaming/orchestrator.py (new)

# Use feature flag to switch
USE_NEW_STREAMING = os.getenv("USE_NEW_STREAMING", "false") == "true"

if USE_NEW_STREAMING:
    from app.tasks.chat.streaming.orchestrator import stream_chat
else:
    # Use existing code
    pass
```

**Rollout**:
1. Week 1-3: Build new code (old code still running)
2. Week 4: Enable for internal testing
3. Week 5: Enable for 10% of users
4. Week 6: Enable for 100%, remove old code

---

## Week-by-Week Implementation Plan

### Week 1: Extract Pure Functions & Testing Infrastructure

**Goal**: Extract all testable logic, set up testing

**Days 1-2: Event Transformers**

**Create**: `app/services/streaming/event_transformers.py`

**Tasks**:
- [ ] Create `TransformedEvent` dataclass
- [ ] Implement `transform_chat_model_stream()`
- [ ] Implement `transform_tool_start()`
- [ ] Implement `transform_tool_end()`
- [ ] Implement `transform_chain_end()`
- [ ] Create event router function

**Tests**: `tests/streaming/unit/test_event_transformers.py`
- [ ] Test valid events
- [ ] Test empty/None values
- [ ] Test missing fields
- [ ] Test all event types

**Deliverables**:
- ✅ 200 lines of pure functions
- ✅ 20+ unit tests
- ✅ 100% coverage
- ✅ Tests run in <50ms

**Days 3-4: Tool Handlers**

**Create**: `app/services/streaming/tool_handlers.py`

**Tasks**:
- [ ] Create `ToolDisplayInfo` dataclass
- [ ] Implement `build_search_knowledge_base_display()`
- [ ] Implement `build_scrape_webpage_display()`
- [ ] Implement `build_generate_podcast_display()`
- [ ] Implement handlers for all 15+ tools
- [ ] Create tool handler registry

**Tests**: `tests/streaming/unit/test_tool_handlers.py`
- [ ] Test in-progress state
- [ ] Test completed state
- [ ] Test error state
- [ ] Test all tools

**Deliverables**:
- ✅ 400 lines of pure functions
- ✅ 40+ unit tests
- ✅ 100% coverage
- ✅ All tool logic extracted

**Day 5: Testing Infrastructure**

**Create**:
- `tests/streaming/conftest.py`
- `tests/streaming/fixtures/agent_events.py`
- `pytest.ini`

**Tasks**:
- [ ] Set up pytest configuration
- [ ] Create shared fixtures
- [ ] Create event fixtures
- [ ] Configure coverage reporting
- [ ] Test parallel execution

**Deliverables**:
- ✅ pytest configured
- ✅ Can run: `pytest tests/streaming/ -v`
- ✅ Coverage reports generated

**Week 1 Metrics**:
- **Lines of Code**: 600 (new pure functions)
- **Tests**: 60+
- **Coverage**: 100% of pure functions
- **Time**: <100ms for all tests

---

### Week 2: State Machine

**Goal**: Extract and test state management

**Days 1-3: Implement State Machine**

**Create**: `app/services/streaming/state_machine.py`

**Tasks**:
- [ ] Create `StreamPhase` enum
- [ ] Create `StreamState` dataclass
- [ ] Implement lifecycle transitions
  - [ ] `start_message()`
  - [ ] `start_step()`
  - [ ] `finish_message()`
- [ ] Implement text streaming
  - [ ] `start_text_block()`
  - [ ] `append_text()`
  - [ ] `end_text_block()`
- [ ] Implement tool execution
  - [ ] `start_tool_execution()`
  - [ ] `end_tool_execution()`
- [ ] Implement thinking steps
  - [ ] `start_thinking_step()`
  - [ ] `complete_current_step()`
- [ ] Add state queries
  - [ ] `is_text_active()`
  - [ ] `can_start_text()`
  - [ ] `can_start_tool()`

**Tests**: `tests/streaming/unit/test_state_machine.py`

**Test Categories**:
- [ ] Lifecycle tests (10 tests)
- [ ] Text streaming tests (15 tests)
- [ ] Tool execution tests (10 tests)
- [ ] Thinking step tests (10 tests)
- [ ] State query tests (10 tests)
- [ ] Invalid transition tests (5 tests)

**Deliverables**:
- ✅ 250 lines of state machine
- ✅ 50+ unit tests
- ✅ 100% coverage
- ✅ All transitions tested

**Days 4-5: Integration Testing**

**Tasks**:
- [ ] Test state machine with real event sequences
- [ ] Test error recovery
- [ ] Test concurrent operations
- [ ] Performance testing

**Week 2 Metrics**:
- **Total Tests**: 110+
- **Coverage**: 100% (state machine)
- **Time**: <150ms for all tests

---

### Week 3: Refactor Event Processor

**Goal**: Simplify `_stream_agent_events()` to 150 lines

**Days 1-3: Create New Event Processor**

**Create**: `app/tasks/chat/streaming/event_processor.py`

**Tasks**:
- [ ] Create main `process_agent_events()` function
- [ ] Implement `_handle_text_event()`
- [ ] Implement `_handle_tool_start()`
- [ ] Implement `_handle_tool_end()`
- [ ] Implement `_handle_chain_end()`
- [ ] Add interrupt detection
- [ ] Add cleanup logic

**Key Changes**:
```python
# OLD (645 lines):
async def _stream_agent_events(...):
    # Everything mixed together
    if event_type == "on_tool_start":
        if tool_name == "search_knowledge_base":
            # 50 lines of tool-specific code
        elif tool_name == "scrape_webpage":
            # 50 lines of tool-specific code
        # ... 15+ tools

# NEW (150 lines):
async def process_agent_events(...):
    async for event in agent.astream_events(...):
        transformed = transform_event(event)  # Pure function
        
        if transformed.event_type == "tool_start":
            display_info = get_tool_display_info(...)  # Pure function
            stream_state.start_tool_execution(...)  # State machine
            yield streaming_service.format_thinking_step(...)  # Protocol
```

**Deliverables**:
- ✅ 200 lines (vs 645 before)
- ✅ Uses all extracted components
- ✅ Clear separation of concerns

**Days 4-5: Comparison Testing**

**Tasks**:
- [ ] Run both old and new side-by-side
- [ ] Compare outputs
- [ ] Fix discrepancies
- [ ] Verify identical behavior

**Week 3 Metrics**:
- **Complexity Reduction**: 77% (645 → 150 lines)
- **Functions Extracted**: 20+
- **Tests**: 130+

---

### Week 4: Integration Tests

**Goal**: Test event processor with mock agent

**Days 1-3: Create Mock Infrastructure**

**Create**: `tests/streaming/fixtures/mock_agents.py`

**Tasks**:
- [ ] Create `MockAgent` class
- [ ] Create `create_basic_chat_agent()`
- [ ] Create `create_chat_with_tool_agent()`
- [ ] Create `create_interrupted_agent()`
- [ ] Create `create_multi_tool_agent()`
- [ ] Create `create_error_agent()`

**Days 4-5: Write Integration Tests**

**Create**: `tests/streaming/integration/test_event_processor.py`

**Test Scenarios**:
- [ ] Basic text streaming (5 tests)
- [ ] Tool execution (10 tests)
- [ ] Multiple tools (5 tests)
- [ ] Interrupts (5 tests)
- [ ] Errors (5 tests)
- [ ] Edge cases (5 tests)

**Deliverables**:
- ✅ Mock agent infrastructure
- ✅ 35+ integration tests
- ✅ 85% coverage of event processor

**Week 4 Metrics**:
- **Total Tests**: 165+
- **Integration Tests**: 35+
- **Mock Coverage**: 90%

---

### Week 5: Protocol Validation & Orchestrator

**Goal**: Ensure protocol compliance, simplify orchestrator

**Days 1-2: Protocol Validator**

**Create**: `app/services/streaming/validators.py`

**Tasks**:
- [ ] Create `SSEProtocolValidator` class
- [ ] Implement stream validation
- [ ] Check message lifecycle
- [ ] Check block opening/closing
- [ ] Check required fields
- [ ] Generate violation reports

**Tests**: `tests/streaming/unit/test_validators.py`
- [ ] Test valid streams (5 tests)
- [ ] Test protocol violations (15 tests)
- [ ] Test edge cases (5 tests)

**Days 3-5: Simplify Orchestrator**

**Create**: 
- `app/tasks/chat/streaming/orchestrator.py`
- `app/tasks/chat/streaming/context_builder.py`

**Tasks**:
- [ ] Extract document fetching
- [ ] Extract context building
- [ ] Create simplified `stream_chat()`
- [ ] Add error handling
- [ ] Add session state management

**Key Simplification**:
```python
# OLD (370 lines):
async def stream_new_chat(...):
    # Load config (50 lines)
    # Create services (50 lines)
    # Fetch documents (50 lines)
    # Build context (50 lines)
    # Format input (30 lines)
    # Stream (80 lines)
    # Error handling (60 lines)

# NEW (100 lines):
async def stream_chat(...):
    agent_config = await load_agent_config(...)  # Delegated
    agent = await create_agent(...)  # Delegated
    context = await build_context(...)  # Delegated
    
    async for sse in process_agent_events(...):  # Simplified
        yield sse
```

**Deliverables**:
- ✅ Protocol validator (200 lines)
- ✅ Simplified orchestrator (100 lines vs 370)
- ✅ 20+ new tests

**Week 5 Metrics**:
- **Total Tests**: 185+
- **Orchestrator Reduction**: 73%
- **Coverage**: 85%+

---

### Week 6: Documentation & CI Integration

**Goal**: Production-ready system with documentation

**Days 1-2: Documentation**

**Create**:
- `docs/testing/STREAMING_TESTING_GUIDE.md`
- `docs/architecture/STREAMING_ARCHITECTURE.md`
- `docs/development/ADDING_NEW_TOOLS.md`

**Content**:
- [ ] Architecture overview
- [ ] Testing guide
- [ ] How to add new tools
- [ ] How to run tests
- [ ] Common patterns
- [ ] Troubleshooting

**Days 3-4: CI Integration**

**Create**: `.github/workflows/streaming-tests.yml`

**Tasks**:
- [ ] Configure pytest in CI
- [ ] Add unit test job
- [ ] Add integration test job
- [ ] Configure coverage reporting
- [ ] Add coverage gate (80% minimum)
- [ ] Configure parallel execution
- [ ] Add test result upload

**CI Workflow**:
```yaml
jobs:
  unit-tests:
    - Install dependencies
    - Run unit tests (<1s)
    - Upload coverage
  
  integration-tests:
    - Install dependencies
    - Run integration tests (<5s)
    - Upload coverage
  
  coverage-check:
    - Combine coverage
    - Enforce 80% minimum
    - Post report to PR
```

**Day 5: Final Polish**

**Tasks**:
- [ ] Run all tests
- [ ] Check coverage
- [ ] Fix any issues
- [ ] Update README
- [ ] Create migration guide
- [ ] Record demo video
- [ ] Team training session

**Deliverables**:
- ✅ Complete documentation
- ✅ CI pipeline configured
- ✅ All tests passing
- ✅ 90%+ coverage
- ✅ Team trained

**Week 6 Metrics**:
- **Total Tests**: 185+
- **Coverage**: 90%+
- **CI Time**: <2 minutes
- **Documentation**: Complete

---

## Testing Strategy

### Test Pyramid

```
           /\
          /  \
         /E2E \      5 tests (manual/optional)
        /------\
       /        \
      /Integration\ 35 tests (<5s)
     /------------\
    /              \
   /  Unit Tests   \ 150 tests (<1s)
  /________________\
```

### Test Categories

#### 1. Unit Tests (150+ tests, <1s)

**Target**: Pure functions, deterministic, no I/O

**Components**:
- Event transformers (20 tests)
- Tool handlers (40 tests)
- State machine (50 tests)
- Protocol formatting (30 tests)
- Validators (15 tests)

**Example**:
```python
def test_transform_chat_stream():
    """Test chat model stream transformation."""
    event = {"data": {"chunk": MockChunk("Hello")}}
    result = transform_chat_model_stream(event)
    
    assert result.event_type == "text"
    assert result.data["delta"] == "Hello"
    assert result.should_emit is True
```

**Characteristics**:
- ✅ No mocks needed
- ✅ Run in parallel
- ✅ 100% deterministic
- ✅ < 1ms per test

#### 2. Integration Tests (35+ tests, <5s)

**Target**: Component interaction, with mocks

**Components**:
- Event processor (25 tests)
- Orchestrator (10 tests)

**Example**:
```python
@pytest.mark.asyncio
async def test_streams_basic_text():
    """Test basic text streaming."""
    agent = create_basic_chat_agent()  # Mock
    streaming_service = VercelStreamingService()
    state = StreamState()
    
    sse_chunks = []
    async for chunk in process_agent_events(agent, ...):
        sse_chunks.append(chunk)
    
    assert any("text-delta" in chunk for chunk in sse_chunks)
```

**Characteristics**:
- ✅ Mock agent (no real LLM)
- ✅ Tests interaction
- ✅ Catches integration bugs
- ✅ < 200ms per test

#### 3. E2E Tests (Optional, manual)

**Target**: Full system with real agent

**Use Cases**:
- Manual testing before release
- Debugging production issues
- Verifying LLM changes

**Not in CI** (too slow, non-deterministic)

### Test Organization

```
tests/streaming/
├── conftest.py                 # Shared fixtures
├── unit/
│   ├── test_protocol.py       # 30 tests
│   ├── test_event_transformers.py # 20 tests
│   ├── test_tool_handlers.py  # 40 tests
│   ├── test_state_machine.py  # 50 tests
│   └── test_validators.py     # 15 tests
├── integration/
│   ├── test_event_processor.py # 25 tests
│   └── test_orchestrator.py   # 10 tests
└── fixtures/
    ├── agent_events.py        # Event data
    └── mock_agents.py         # Mock agents
```

### Coverage Goals

| Component | Target Coverage |
|-----------|----------------|
| Event Transformers | **100%** |
| Tool Handlers | **100%** |
| State Machine | **100%** |
| Protocol Formatting | **100%** |
| Validators | **95%** |
| Event Processor | **85%** |
| Orchestrator | **80%** |
| **Overall** | **90%+** |

### Test Execution

**Local Development**:
```bash
# Run all tests
pytest tests/streaming/ -v

# Run only unit tests (fast)
pytest tests/streaming/unit/ -v

# Run with coverage
pytest tests/streaming/ --cov=app/services/streaming --cov-report=html

# Run specific test
pytest tests/streaming/unit/test_event_transformers.py::TestTransformChatStream -v

# Watch mode (re-run on changes)
pytest-watch tests/streaming/
```

**CI Pipeline**:
```bash
# Unit tests (parallel, <1s)
pytest tests/streaming/unit/ -n auto --dist loadgroup

# Integration tests (<5s)
pytest tests/streaming/integration/ -v

# Coverage check (fail if <80%)
pytest tests/streaming/ --cov --cov-fail-under=80
```

---

## Success Metrics

### Code Quality Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Lines in `_stream_agent_events()` | 645 | 150 | **77% reduction** |
| Lines in `stream_new_chat()` | 370 | 100 | **73% reduction** |
| Test Coverage | 0% | 90%+ | **+90%** |
| Number of Tests | 0 | 185+ | **+185** |
| Cyclomatic Complexity | Very High | Low | **-70%** |

### Performance Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Unit Test Execution | < 1s | TBD |
| Integration Test Execution | < 5s | TBD |
| Total CI Time | < 2 min | TBD |
| Coverage Report Generation | < 10s | TBD |

### Development Velocity

| Metric | Before | After |
|--------|--------|-------|
| Time to Add New Tool | 2-3 hours | **30 min** |
| Time to Fix Bug | 1-2 days | **1-2 hours** |
| Time to Review PR | 2-3 hours | **30 min** |
| Confidence in Changes | Low | **High** |

### Reliability Metrics

| Metric | Target |
|--------|--------|
| Test Pass Rate | > 99% |
| Flakiness Rate | < 1% |
| Production Bugs Caught | > 90% |
| Regression Detection | > 95% |

---

## Risk Assessment

### Technical Risks

#### Risk 1: Breaking Existing Functionality

**Probability**: Medium  
**Impact**: High  
**Mitigation**:
- Keep old code running in parallel
- Use feature flags
- Compare outputs side-by-side
- Gradual rollout (10% → 100%)

#### Risk 2: Test Flakiness

**Probability**: Low  
**Impact**: Medium  
**Mitigation**:
- Pure functions (no flakiness)
- Deterministic mocks
- Explicit timeouts
- Retry logic only where needed

#### Risk 3: Incomplete Coverage

**Probability**: Low  
**Impact**: Medium  
**Mitigation**:
- 90%+ target coverage
- Review coverage reports
- Add tests for edge cases
- CI enforcement

#### Risk 4: Performance Degradation

**Probability**: Very Low  
**Impact**: Medium  
**Mitigation**:
- Pure functions are faster
- Less code = faster execution
- Benchmark before/after
- Monitor in production

### Schedule Risks

#### Risk 1: Timeline Slippage

**Probability**: Medium  
**Impact**: Low  
**Mitigation**:
- Break into small tasks
- Daily progress tracking
- Can ship incrementally
- Week 1-2 is high value alone

#### Risk 2: Resource Availability

**Probability**: Low  
**Impact**: Medium  
**Mitigation**:
- Plan assumes 1 developer
- Can scale to 2 developers
- Clear task boundaries
- Documentation for handoff

### Adoption Risks

#### Risk 1: Team Learning Curve

**Probability**: Medium  
**Impact**: Low  
**Mitigation**:
- Comprehensive documentation
- Training session
- Pair programming
- Clear examples

#### Risk 2: Resistance to Change

**Probability**: Low  
**Impact**: Low  
**Mitigation**:
- Demonstrate quick wins
- Show test benefits
- Involve team early
- Address concerns

---

## Appendices

### Appendix A: Example Code

#### Before (Current State)

```python
# app/tasks/chat/stream_new_chat.py (lines 290-340)
async def _stream_agent_events(...):
    # 645 lines of mixed responsibilities
    
    async for event in agent.astream_events(...):
        event_type = event.get("event", "")
        
        if event_type == "on_tool_start":
            tool_name = event.get("name", "unknown_tool")
            run_id = event.get("run_id", "")
            tool_input = event.get("data", {}).get("input", {})
            
            # 50 lines of tool-specific logic
            if tool_name == "search_knowledge_base":
                query = tool_input.get("query", "")
                last_active_step_title = "Searching knowledge base"
                last_active_step_items = [f"Query: {query[:100]}"]
                yield streaming_service.format_thinking_step(...)
            elif tool_name == "link_preview":
                url = tool_input.get("url", "")
                last_active_step_title = "Fetching link preview"
                last_active_step_items = [f"URL: {url[:80]}"]
                yield streaming_service.format_thinking_step(...)
            # ... 13+ more tools
```

#### After (Proposed State)

```python
# app/tasks/chat/streaming/event_processor.py
async def process_agent_events(...):
    # 150 lines, clear separation
    
    async for event in agent.astream_events(...):
        # 1. Transform (pure function)
        transformed = transform_event(event)
        
        # 2. Handle by type
        if transformed.event_type == "tool_start":
            # Get display info (pure function)
            display_info = get_tool_display_info(
                transformed.tool_name,
                transformed.data["input"],
                status="in_progress"
            )
            
            # Update state (state machine)
            stream_state.start_tool_execution(...)
            
            # Format SSE (protocol)
            yield streaming_service.format_thinking_step(
                display_info.step_title,
                display_info.items
            )
```

### Appendix B: Test Examples

#### Unit Test Example

```python
# tests/streaming/unit/test_tool_handlers.py
def test_search_knowledge_base_display_in_progress():
    """Test search tool display in progress state."""
    # Arrange
    tool_input = {"query": "What is machine learning?"}
    
    # Act
    info = build_search_knowledge_base_display(
        tool_input,
        status="in_progress"
    )
    
    # Assert
    assert info.step_title == "Searching knowledge base"
    assert len(info.items) == 1
    assert "Query: What is machine learning?" in info.items[0]
    assert info.success_message is None

def test_search_knowledge_base_display_completed():
    """Test search tool display completed state."""
    # Arrange
    tool_input = {"query": "test"}
    tool_output = {"result_length": 1500}
    
    # Act
    info = build_search_knowledge_base_display(
        tool_input,
        tool_output,
        status="completed"
    )
    
    # Assert
    assert "Found relevant information (1500 chars)" in info.items[1]
    assert info.success_message is not None
```

#### Integration Test Example

```python
# tests/streaming/integration/test_event_processor.py
@pytest.mark.asyncio
async def test_handles_tool_execution():
    """Test event processor handles tool execution."""
    # Arrange
    agent = create_chat_with_tool_agent()
    streaming_service = VercelStreamingService()
    state = StreamState()
    state.start_message("msg_1")
    state.start_step()
    
    # Act
    sse_chunks = []
    async for chunk in process_agent_events(
        agent=agent,
        config={},
        input_data={},
        streaming_service=streaming_service,
        stream_state=state
    ):
        sse_chunks.append(chunk)
    
    # Assert
    assert any("tool-input-start" in chunk for chunk in sse_chunks)
    assert any("tool-output-available" in chunk for chunk in sse_chunks)
    assert any("thinking-step" in chunk for chunk in sse_chunks)
    assert len(state.completed_steps) > 0
```

### Appendix C: File Structure Reference

**Complete File Tree**:
```
surfsense_backend/
├── app/
│   ├── services/
│   │   ├── streaming/
│   │   │   ├── __init__.py
│   │   │   ├── protocol.py              # Renamed from new_streaming_service.py
│   │   │   ├── event_transformers.py    # NEW - 200 lines
│   │   │   ├── tool_handlers.py         # NEW - 400 lines
│   │   │   ├── state_machine.py         # NEW - 250 lines
│   │   │   └── validators.py            # NEW - 200 lines
│   │   └── new_streaming_service.py     # EXISTING - keep for now
│   │
│   └── tasks/chat/
│       ├── streaming/
│       │   ├── __init__.py
│       │   ├── event_processor.py       # NEW - 200 lines
│       │   ├── context_builder.py       # NEW - 100 lines
│       │   ├── orchestrator.py          # NEW - 150 lines
│       │   └── resume_handler.py        # NEW - 100 lines
│       └── stream_new_chat.py           # EXISTING - will deprecate
│
├── tests/
│   └── streaming/
│       ├── __init__.py
│       ├── conftest.py                  # NEW - shared fixtures
│       ├── unit/
│       │   ├── __init__.py
│       │   ├── test_protocol.py         # NEW - 30 tests
│       │   ├── test_event_transformers.py # NEW - 20 tests
│       │   ├── test_tool_handlers.py    # NEW - 40 tests
│       │   ├── test_state_machine.py    # NEW - 50 tests
│       │   └── test_validators.py       # NEW - 15 tests
│       ├── integration/
│       │   ├── __init__.py
│       │   ├── test_event_processor.py  # NEW - 25 tests
│       │   └── test_orchestrator.py     # NEW - 10 tests
│       └── fixtures/
│           ├── __init__.py
│           ├── agent_events.py          # NEW - event data
│           └── mock_agents.py           # NEW - mock agents
│
├── docs/
│   ├── testing/
│   │   └── STREAMING_TESTING_GUIDE.md   # NEW
│   ├── architecture/
│   │   └── STREAMING_ARCHITECTURE.md    # NEW
│   └── development/
│       └── ADDING_NEW_TOOLS.md          # NEW
│
├── .github/
│   └── workflows/
│       └── streaming-tests.yml          # NEW
│
└── pytest.ini                            # NEW or UPDATE
```

### Appendix D: Team Resources

**Training Materials**:
- [ ] Architecture overview presentation
- [ ] Testing patterns video walkthrough
- [ ] How to add a new tool guide
- [ ] Common patterns cheat sheet
- [ ] Troubleshooting guide

**Documentation**:
- [ ] STREAMING_TESTING_GUIDE.md
- [ ] STREAMING_ARCHITECTURE.md
- [ ] ADDING_NEW_TOOLS.md
- [ ] MIGRATION_GUIDE.md

**Tools & Scripts**:
- [ ] Test runner script
- [ ] Coverage report generator
- [ ] Mock agent generator
- [ ] Protocol validator CLI

---

## Next Steps

### Immediate Actions (This Week)

1. **Review & Approve Plan**
   - [ ] Team review meeting
   - [ ] Address questions/concerns
   - [ ] Get stakeholder sign-off

2. **Set Up Environment**
   - [ ] Create feature branch
   - [ ] Set up test directories
   - [ ] Configure pytest

3. **Start Week 1, Day 1**
   - [ ] Create `event_transformers.py`
   - [ ] Write first tests
   - [ ] Get first green test!

### Contact & Support

**Technical Lead**: [Name]  
**Project Manager**: [Name]  
**Questions**: [Slack Channel]  
**Issues**: [GitHub Issues]

---

## Conclusion

This refactoring plan transforms the SurfSense streaming system from:
- **Untestable** → 90%+ test coverage
- **Complex** → Clear, maintainable
- **Risky** → Safe, verified
- **Slow development** → Rapid iteration

By following this 6-week plan, we'll build a solid foundation for reliable, maintainable streaming that enables the team to ship features with confidence.

**Let's build something great! 🚀**

---

*Document Version: 1.0*  
*Last Updated: February 2026*  
*Next Review: End of Week 2*
