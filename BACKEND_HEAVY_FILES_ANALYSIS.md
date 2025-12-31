# Backend Heavy Files - Refactoring Analysis

**Date**: December 31, 2024  
**Status**: Analysis Complete, Ready for Implementation

---

## Top 5 Heaviest Files

### 1. **connector_service.py** - 2,510 lines 🚨

**Location**: `app/services/connector_service.py`  
**Issue**: God object anti-pattern - handles 23 different connector types in one class

**Structure**:
- 26 total methods
- 23 search methods (one per connector: Slack, Notion, GitHub, Jira, etc.)
- 3 core methods: `initialize_counter`, `_combined_rrf_search`, `get_connector_by_type`

**Refactoring Strategy**:

```
Phase 1: Extract Base Class
├── Create: app/services/connectors/base.py (~150 lines)
│   ├── BaseConnectorService with shared logic
│   ├── initialize_counter()
│   ├── _combined_rrf_search() (RRF fusion logic)
│   └── get_connector_by_type()

Phase 2: Extract Connector Services (23 files)
├── Internal Sources (4 files in app/services/connectors/internal/)
│   ├── crawled_urls_service.py (~90 lines)
│   ├── files_service.py (~66 lines)
│   ├── extension_service.py (~97 lines)
│   └── notes_service.py (~69 lines)
│
├── External APIs (5 files in app/services/connectors/external/)
│   ├── tavily_service.py (~106 lines)
│   ├── searxng_service.py (~185 lines)
│   ├── baidu_service.py (~224 lines)
│   ├── linkup_service.py (~121 lines)
│   └── elasticsearch_service.py (~86 lines)
│
└── Third-Party Integrations (14 files in app/services/connectors/integrations/)
    ├── slack_service.py (~74 lines)
    ├── notion_service.py (~70 lines)
    ├── youtube_service.py (~81 lines)
    ├── github_service.py (~60 lines)
    ├── linear_service.py (~100 lines)
    ├── jira_service.py (~106 lines)
    ├── google_calendar_service.py (~106 lines)
    ├── airtable_service.py (~76 lines)
    ├── google_gmail_service.py (~100 lines)
    ├── confluence_service.py (~71 lines)
    ├── clickup_service.py (~94 lines)
    ├── discord_service.py (~75 lines)
    ├── luma_service.py (~109 lines)
    └── bookstack_service.py (~73 lines)

Phase 3: Service Factory
├── Create: app/services/connectors/factory.py (~100 lines)
│   ├── SERVICE_REGISTRY mapping types to classes
│   └── get_connector_service(connector_type) factory method

Phase 4: Facade Pattern
├── Update: app/services/connector_service.py (~120 lines)
│   └── Delegate all search_* methods to factory

Phase 5: Update Imports
├── app/routes/new_chat_routes.py (906 lines)
├── app/tasks/chat/stream_new_chat.py (1,061 lines)
└── app/services/new_streaming_service.py (728 lines)
```

**Expected Outcome**:
- 2,510 lines → ~2,470 lines (24 files)
- 95% reduction in main file (2,510 → 120 lines)
- Each connector isolated in its own testable module

**Time Estimate**: 6-8 hours

---

### 2. **rbac_routes.py** - 1,084 lines 🚨

**Location**: `app/routes/rbac_routes.py`  
**Issue**: All RBAC (Role-Based Access Control) logic in one route file

**Quick Analysis**:
```bash
grep -c 'async def' app/routes/rbac_routes.py  # Count endpoints
```

**Refactoring Strategy** (TBD after analysis):
```
Phase 1: Group related endpoints
├── Permissions routes
├── Roles routes
├── Assignments routes
└── Validation logic

Phase 2: Extract to separate files
├── app/routes/rbac/permissions.py
├── app/routes/rbac/roles.py
├── app/routes/rbac/assignments.py
└── app/services/rbac_service.py (business logic)

Phase 3: Create RBAC service layer
└── Move business logic from routes to service
```

**Expected Outcome**:
- 1,084 lines → ~300 lines (4-5 files)
- Separation of concerns: routes vs business logic

**Time Estimate**: 3-4 hours

---

### 3. **file_processors.py** - 1,069 lines 🚨

**Location**: `app/tasks/document_processors/file_processors.py`  
**Issue**: Handles processing for many file types in one module

**Quick Analysis**:
```bash
grep -E 'class.*Processor' app/tasks/document_processors/file_processors.py
# Count processor classes
```

**Refactoring Strategy** (TBD after analysis):
```
Phase 1: Extract processor base class
├── Create: app/tasks/document_processors/base.py
└── BaseFileProcessor with shared logic

Phase 2: Split by file type category
├── app/tasks/document_processors/text_processors.py (PDF, DOCX, TXT)
├── app/tasks/document_processors/spreadsheet_processors.py (XLSX, CSV)
├── app/tasks/document_processors/presentation_processors.py (PPTX)
├── app/tasks/document_processors/image_processors.py (PNG, JPG)
└── app/tasks/document_processors/code_processors.py (PY, JS, etc.)

Phase 3: Processor factory
└── app/tasks/document_processors/factory.py
```

**Expected Outcome**:
- 1,069 lines → ~1,100 lines (6-8 files)
- Each processor type in dedicated file

**Time Estimate**: 4-5 hours

---

### 4. **stream_new_chat.py** - 1,061 lines 🚨

**Location**: `app/tasks/chat/stream_new_chat.py`  
**Issue**: Complex streaming logic with multiple responsibilities

**Refactoring Strategy** (TBD after analysis):
```
Phase 1: Extract streaming components
├── app/tasks/chat/stream/handlers.py (event handlers)
├── app/tasks/chat/stream/formatters.py (response formatting)
├── app/tasks/chat/stream/validators.py (input validation)
└── app/tasks/chat/stream/processors.py (message processing)

Phase 2: State management
└── app/tasks/chat/stream/state.py (streaming state)

Phase 3: Update main file
└── stream_new_chat.py becomes orchestrator (~150-200 lines)
```

**Expected Outcome**:
- 1,061 lines → ~1,100 lines (5-6 files)
- Clear separation of streaming concerns

**Time Estimate**: 4-5 hours

---

### 5. **new_chat_routes.py** - 906 lines 🚨

**Location**: `app/routes/new_chat_routes.py`  
**Issue**: Many chat-related endpoints in one file

**Quick Analysis**:
```bash
grep '@router' app/routes/new_chat_routes.py | wc -l  # Count endpoints
```

**Refactoring Strategy** (TBD after analysis):
```
Phase 1: Group endpoints by functionality
├── Chat thread management
├── Message operations
├── Streaming endpoints
└── Chat history

Phase 2: Split into focused files
├── app/routes/chat/threads.py (~200 lines)
├── app/routes/chat/messages.py (~200 lines)
├── app/routes/chat/streaming.py (~250 lines)
└── app/routes/chat/history.py (~200 lines)

Phase 3: Create chat service
└── app/services/chat_service.py (extract business logic)
```

**Expected Outcome**:
- 906 lines → ~900 lines (4-5 files)
- Logical grouping of related endpoints

**Time Estimate**: 3-4 hours

---

## Overall Refactoring Timeline

### Priority Order:

**Week 1-2: connector_service.py** (highest impact)
- Day 1-2: Extract base class + 5 connector services (PoC)
- Day 3-4: Extract remaining 18 connector services
- Day 5: Create factory, update facade, test

**Week 3: rbac_routes.py + new_chat_routes.py**
- Day 1-2: RBAC refactoring
- Day 3-4: Chat routes refactoring
- Day 5: Testing and integration

**Week 4: file_processors.py + stream_new_chat.py**
- Day 1-2: File processors refactoring
- Day 3-4: Streaming refactoring
- Day 5: Testing and integration

**Total Estimated Time**: 15-20 days (full-time) or 4-5 weeks (part-time)

---

## Success Metrics

**Code Quality**:
- ✅ Average file size < 300 lines
- ✅ Single Responsibility Principle applied
- ✅ Each module independently testable

**Maintainability**:
- ✅ Easy to locate connector/feature logic
- ✅ Clear file/module organization
- ✅ Reduced cognitive load (no 2,500-line files)

**Testing**:
- ✅ Unit tests for each extracted module
- ✅ Integration tests remain passing
- ✅ >60% test coverage for refactored code

---

## Next Steps

1. **Review this analysis** with team
2. **Prioritize** which file to tackle first (recommendation: connector_service.py)
3. **Create detailed plan** for chosen file
4. **Implement incrementally** with frequent commits
5. **Test thoroughly** after each phase
6. **Move to next file** once first is complete and stable

---

**Status**: 🟡 Analysis Complete, Awaiting Implementation Decision  
**Recommendation**: Start with `connector_service.py` (highest complexity, highest impact)  
**Created**: December 31, 2024

