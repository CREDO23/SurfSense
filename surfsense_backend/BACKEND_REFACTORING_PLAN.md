# Backend Refactoring Plan - connector_service.py

## Current State
- **File**: `app/services/connector_service.py`
- **Lines**: 2,510 lines
- **Methods**: 26 methods (23 search methods + 3 core methods)
- **Issue**: God object anti-pattern - single file handles all connector types

## Refactoring Strategy

### Phase 1: Extract Base Classes (1-2 hours)

**Create**: `app/services/connectors/base.py` (~150 lines)
- Extract `BaseConnectorService` with shared functionality:
  - `initialize_counter()`
  - `_combined_rrf_search()` 
  - `get_connector_by_type()`
  - Counter management logic
  - Session/retriever setup

### Phase 2: Extract Search Connector Services (4-6 hours)

Create individual service files for each connector type:

**Internal/Document Sources** (in `app/services/connectors/internal/`):
1. `crawled_urls_service.py` - search_crawled_urls (lines 62-151)
2. `files_service.py` - search_files (lines 152-217)
3. `extension_service.py` - search_extension (lines 1087-1183)
4. `notes_service.py` - search_notes (lines 2369-2437)

**External Search APIs** (in `app/services/connectors/external/`):
5. `tavily_service.py` - search_tavily (lines 428-533)
6. `searxng_service.py` - search_searxng (lines 534-718)
7. `baidu_service.py` - search_baidu (lines 719-942)
8. `linkup_service.py` - search_linkup (lines 1978-2098)
9. `elasticsearch_service.py` - search_elasticsearch (lines 2283-2368)

**Third-Party Integrations** (in `app/services/connectors/integrations/`):
10. `slack_service.py` - search_slack (lines 943-1016)
11. `notion_service.py` - search_notion (lines 1017-1086)
12. `youtube_service.py` - search_youtube (lines 1184-1264)
13. `github_service.py` - search_github (lines 1265-1324)
14. `linear_service.py` - search_linear (lines 1325-1424)
15. `jira_service.py` - search_jira (lines 1425-1530)
16. `google_calendar_service.py` - search_google_calendar (lines 1531-1636)
17. `airtable_service.py` - search_airtable (lines 1637-1712)
18. `google_gmail_service.py` - search_google_gmail (lines 1713-1812)
19. `confluence_service.py` - search_confluence (lines 1813-1883)
20. `clickup_service.py` - search_clickup (lines 1884-1977)
21. `discord_service.py` - search_discord (lines 2099-2173)
22. `luma_service.py` - search_luma (lines 2174-2282)
23. `bookstack_service.py` - search_bookstack (lines 2438-end)

### Phase 3: Create Service Factory (30 min)

**Create**: `app/services/connectors/factory.py` (~100 lines)
- Service registry mapping connector types to service classes
- Factory method to instantiate correct service
- Backward compatibility wrapper

### Phase 4: Update Main Service (30 min)

**Update**: `app/services/connector_service.py`
- Keep as facade/orchestrator (~100-150 lines)
- Delegate to specific services via factory
- Maintain backward compatibility

### Phase 5: Update Imports (1 hour)

**Files to update**:
- `app/routes/new_chat_routes.py` (906 lines) - uses ConnectorService
- `app/tasks/chat/stream_new_chat.py` (1,061 lines) - uses ConnectorService
- `app/services/new_streaming_service.py` (728 lines) - uses ConnectorService
- Any other files importing ConnectorService

## Expected Outcome

```
Before:  connector_service.py           2,510 lines

After:
         connectors/base.py                150 lines
         connectors/factory.py             100 lines
         connector_service.py (facade)     120 lines
         connectors/internal/* (4 files)   400 lines
         connectors/external/* (5 files)   500 lines
         connectors/integrations/* (14)  1,200 lines
         ────────────────────────────────────────────
         Total:                          2,470 lines
```

**Benefits**:
- ✅ Single Responsibility: Each service handles one connector type
- ✅ Easier Testing: Test individual connectors in isolation
- ✅ Easier Debugging: Issues isolated to specific service files
- ✅ Better Organization: Logical grouping (internal/external/integrations)
- ✅ Easier Onboarding: New devs can find connector logic quickly
- ✅ Future Proof: Easy to add new connectors without bloating main file

## Implementation Order

1. Create base classes first (base.py)
2. Extract one connector as proof-of-concept (e.g., tavily_service.py)
3. Test to ensure it works
4. Extract remaining connectors in batches
5. Create factory
6. Update main service to use factory
7. Update all imports
8. Run full test suite

## Risk Mitigation

- Keep original connector_service.py as connector_service_old.py during refactoring
- Implement backward compatibility in facade
- Test each extracted service individually
- Run integration tests after each batch
- Commit frequently with descriptive messages

