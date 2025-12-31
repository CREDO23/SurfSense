# Long Tasks Remaining (30+ minutes)

**Generated**: $(date -u +"%Y-%m-%d %H:%M UTC")
**Status**: After Logs Page 100% Complete, Chat Page 60% Complete

---

## Overview

This document lists all remaining tasks that will take **30+ minutes** to complete. Tasks are organized by priority and estimated time.

**Progress Summary**:
- ✅ **Completed**: LLM Models, Connector Forms (15/15), Team Page, Logs Page
- ⏳ **In Progress**: Chat Page (60% - utilities extracted, page update pending)
- ⏸️ **Not Started**: Large hooks, backend splits, infrastructure, testing

---

## Priority 0: Complete In-Progress Work

### 1. Complete Chat Page Refactoring (15 min)
**Status**: 60% complete - utilities extracted, main page needs import updates  
**File**: `surfsense_web/app/dashboard/[search_space_id]/new-chat/[[...chat_id]]/page.tsx`  
**Current**: 923 lines  
**Target**: ~780 lines (15% reduction)  

**What's Already Done**:
- ✅ Extracted `lib/chat/chat-utils.tsx` (183 lines)
- ✅ Extracted `hooks/use-thread-initializer.ts` (130 lines)
- ✅ Build passing

**Remaining Work** (15 min):
1. Import extracted utilities and hook
2. Remove duplicate inline functions (lines 57-205)
3. Replace initialization code with `useThreadInitializer` hook
4. Remove unused imports
5. Build and verify

**Why Not Further Split?**
- Chat page has 400+ lines of complex SSE streaming logic
- Extracting it would make code harder to follow
- Conservative approach: utilities extracted, streaming stays inline

---

## Priority 1: Frontend Heavy Files (30 min - 4 hours each)

### 2. Assistant-UI Thread Component (3-4 hours)
**File**: `surfsense_web/components/assistant-ui/thread.tsx`  
**Size**: 1,088 lines  
**Complexity**: HIGH - Core chat rendering logic

**Split Strategy**:
- Extract message rendering → `MessageRenderer.tsx` (~300 lines)
- Extract thinking steps UI → `ThinkingStepsUI.tsx` (~150 lines)
- Extract tool UI rendering → `ToolUIRenderer.tsx` (~200 lines)
- Extract message actions → `MessageActions.tsx` (~100 lines)
- Keep thread orchestration in main file (~350 lines)

**Estimated Impact**: 1,088 → ~400 lines (63% reduction)

---

### 3. Connectors Manage Page (2-3 hours)
**File**: `surfsense_web/app/dashboard/[search_space_id]/connectors/(manage)/page.tsx`  
**Size**: 715 lines  

**Split Strategy**:
- Extract table component → `ConnectorsTable.tsx` (~250 lines)
- Extract filter panel → `ConnectorFilters.tsx` (~150 lines)
- Extract connector cards → `ConnectorCard.tsx` (~120 lines)
- Extract action dialogs → `ConnectorActions.tsx` (~100 lines)
- Main page orchestration (~100 lines)

**Estimated Impact**: 715 → ~150 lines (79% reduction)

---

### 4. Sidebar Component (2-3 hours)
**File**: `surfsense_web/components/ui/sidebar.tsx`  
**Size**: 690 lines  
**Type**: Shared UI component

**Split Strategy**:
- Extract sidebar item → `SidebarItem.tsx` (~100 lines)
- Extract sidebar group → `SidebarGroup.tsx` (~80 lines)
- Extract sidebar menu → `SidebarMenu.tsx` (~120 lines)
- Extract sidebar rail → `SidebarRail.tsx` (~80 lines)
- Keep core sidebar logic (~310 lines)

**Estimated Impact**: 690 → ~310 lines (55% reduction)

---

### 5. Large Hook: use-connector-edit-page (2-3 hours)
**File**: `surfsense_web/hooks/use-connector-edit-page.ts`  
**Size**: 672 lines  
**Complexity**: HIGH - Form state, validation, mutations, navigation

**Split Strategy**:
- Extract form state → `use-connector-form-state.ts` (~180 lines)
- Extract validation → `use-connector-validation.ts` (~150 lines)
- Extract mutations → `use-connector-mutations.ts` (~200 lines)
- Extract navigation → `use-connector-navigation.ts` (~80 lines)
- Main orchestration hook (~100 lines)

**Estimated Impact**: 672 → ~100 lines (85% reduction)

---

### 6. Source Detail Panel (2 hours)
**File**: `surfsense_web/components/new-chat/source-detail-panel.tsx`  
**Size**: 607 lines  

**Split Strategy**:
- Extract document view → `DocumentView.tsx` (~200 lines)
- Extract source info → `SourceInfo.tsx` (~150 lines)
- Extract metadata panel → `MetadataPanel.tsx` (~120 lines)
- Main panel orchestration (~140 lines)

**Estimated Impact**: 607 → ~150 lines (75% reduction)

---

### 7. LLM Config Form (1-2 hours)
**File**: `surfsense_web/components/shared/llm-config-form.tsx`  
**Size**: 576 lines  

**Split Strategy**:
- Extract provider selector → `ProviderSelector.tsx` (~120 lines)
- Extract model selector → `ModelSelector.tsx` (~150 lines)
- Extract parameter controls → `ModelParameters.tsx` (~180 lines)
- Main form orchestration (~130 lines)

**Estimated Impact**: 576 → ~140 lines (76% reduction)

---

### 8. Editor Page (2-3 hours)
**File**: `surfsense_web/app/dashboard/[search_space_id]/editor/[documentId]/page.tsx`  
**Size**: 520 lines  

**Split Strategy**:
- Extract document editor → `DocumentEditor.tsx` (~200 lines)
- Extract editor toolbar → `EditorToolbar.tsx` (~120 lines)
- Extract editor sidebar → `EditorSidebar.tsx` (~100 lines)
- Main page orchestration (~100 lines)

**Estimated Impact**: 520 → ~110 lines (79% reduction)

---

## Priority 2: Backend Heavy Files (3-8 hours each)

### 9. Connector Service Split (6-8 hours)
**File**: `surfsense_backend/app/services/connector_service.py`  
**Size**: 2,508 lines  
**Complexity**: CRITICAL - God object with 40+ methods

**Split Strategy** (per `MODULARIZATION_STRATEGY.md`):
- Create base class: `BaseConnectorService` (~200 lines)
- Split into 15+ connector-specific services:
  - `GoogleDriveConnectorService` (~150 lines)
  - `NotionConnectorService` (~180 lines)
  - `SlackConnectorService` (~140 lines)
  - `GithubConnectorService` (~160 lines)
  - ...and 11 more

**Estimated Impact**: 2,508 → 15-20 modular files (~150-200 lines each)

---

### 10. RBAC Routes Split (3-4 hours)
**File**: `surfsense_backend/app/routes/rbac_routes.py`  
**Size**: 1,084 lines  

**Split Strategy**:
- Extract user routes → `routes/users.py` (~250 lines)
- Extract role routes → `routes/roles.py` (~200 lines)
- Extract permission routes → `routes/permissions.py` (~250 lines)
- Extract membership routes → `routes/memberships.py` (~200 lines)
- Main RBAC orchestration (~200 lines)

**Estimated Impact**: 1,084 → 5 modular files

---

### 11. File Processors Split (3-4 hours)
**File**: `surfsense_backend/app/tasks/document_processors/file_processors.py`  
**Size**: 1,067 lines  

**Split Strategy**:
- Extract PDF processor → `processors/pdf_processor.py` (~250 lines)
- Extract Word processor → `processors/word_processor.py` (~150 lines)
- Extract Excel processor → `processors/excel_processor.py` (~180 lines)
- Extract image processor → `processors/image_processor.py` (~200 lines)
- Extract text processor → `processors/text_processor.py` (~120 lines)
- Base processor class (~170 lines)

**Estimated Impact**: 1,067 → 6 modular files

---

### 12. Stream New Chat (3-4 hours)
**File**: `surfsense_backend/app/tasks/chat/stream_new_chat.py`  
**Size**: 1,058 lines  
**Complexity**: HIGH - SSE streaming, LangGraph integration

**Split Strategy**:
- Extract streaming handlers → `stream_handlers.py` (~300 lines)
- Extract message formatting → `message_formatters.py` (~200 lines)
- Extract error handling → `stream_errors.py` (~150 lines)
- Main streaming orchestration (~410 lines)

**Estimated Impact**: 1,058 → ~450 lines (57% reduction)

---

### 13. New Chat Routes (2-3 hours)
**File**: `surfsense_backend/app/routes/new_chat_routes.py`  
**Size**: 906 lines  

**Split Strategy**:
- Extract thread routes → `routes/chat/threads.py` (~250 lines)
- Extract message routes → `routes/chat/messages.py` (~200 lines)
- Extract streaming routes → `routes/chat/streaming.py` (~250 lines)
- Main chat router (~210 lines)

**Estimated Impact**: 906 → 4 modular files

---

## Priority 3: Performance Quick Wins (30-45 min each)

### 14. Add Database Indexes (45 min)
**Impact**: HIGH - 60-80% faster queries  
**Risk**: LOW

**Actions**:
1. Create Alembic migration:
   ```bash
   cd surfsense_backend
   alembic revision -m "add_performance_indexes"
   ```

2. Add 5 composite indexes:
   - `idx_documents_space_type` on `documents(search_space_id, document_type)`
   - `idx_chunks_document_id` on `chunks(document_id)`
   - `idx_chat_threads_space_archived` on `chat_threads(search_space_id, archived)`
   - `idx_membership_user` on `membership(user_id)`
   - `idx_membership_space_role` on `membership(search_space_id, role)`

3. Apply migration:
   ```bash
   alembic upgrade head
   ```

**Expected Impact**:
- List endpoints: 80-90% faster (500ms → 50-100ms)
- Search queries: 60-70% faster

---

### 15. Add Connection Pool Configuration (30 min)
**Impact**: MEDIUM - Reduces connection overhead  
**Risk**: LOW  
**File**: `surfsense_backend/app/db.py:819`

**Actions**:
```python
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=20,           # ← Add this
    max_overflow=10,        # ← Add this
    pool_pre_ping=True,     # ← Add this
    pool_recycle=3600,      # ← Add this
)
```

**Expected Impact**:
- Database connections: 70% reduction (100 → 30 concurrent)
- Connection reuse: Improved by 80%

---

### 16. Fix N+1 Queries in Search Spaces (30 min)
**Impact**: HIGH - 80% faster list endpoint  
**Risk**: LOW  
**File**: `surfsense_backend/app/routes/search_spaces_routes.py:108-180`

**Actions**:
```python
# In read_search_spaces() function
spaces = (
    db.query(SearchSpace)
    .options(selectinload(SearchSpace.memberships))  # ← Add this
    .filter(...)
    .all()
)
```

**Expected Impact**:
- Queries: 101 → 2 (99% reduction)
- Response time: 500ms → 100ms

---

## Priority 4: Testing Infrastructure (1-2 hours each)

### 17. Add Tests for Logs Components (1-2 hours)
**Coverage**: Currently 0%  
**Target**: 60%+  

**Files to Test** (7 components):
- `components/logs/LogsFilters.tsx` (242 lines)
- `components/logs/logs-config.tsx` (201 lines)
- `components/logs/LogsTable.tsx` (189 lines)
- `components/logs/LogsSummaryDashboard.tsx` (152 lines)
- `components/logs/LogsPagination.tsx` (111 lines)
- `components/logs/LogRowActions.tsx` (103 lines)
- `components/logs/MessageDetails.tsx` (61 lines)

**Test Strategy**:
- Unit tests: Rendering, props, interactions
- Integration tests: Pagination, filtering, bulk delete
- E2E tests: Full logs workflow

---

### 18. Add Tests for Chat Utilities (30-45 min)
**Coverage**: Currently 0%  
**Target**: 80%+ (pure functions - easy to test)  

**Files to Test**:
- `lib/chat/chat-utils.tsx` (183 lines) - 4 utility functions
- `hooks/use-thread-initializer.ts` (130 lines) - Custom hook

**Test Strategy**:
- Unit tests: Each utility function independently
- Hook tests: useThreadInitializer with React Testing Library

---

### 19. Add Backend Unit Tests (4-6 hours)
**Coverage**: Currently 0%  
**Target**: 60%+  

**Priority Files**:
- `services/connector_service.py` (2,508 lines) - After splitting
- `routes/rbac_routes.py` (1,084 lines)
- `tasks/document_processors/file_processors.py` (1,067 lines)

**Test Infrastructure Needed**:
1. Create `tests/` directory structure
2. Create `conftest.py` with fixtures (DB, client, mocks)
3. Add pytest configuration
4. Mock external services (S3, Redis, Celery)

---

## Priority 5: Infrastructure Improvements (2-8 hours each)

### 20. Add Kubernetes Manifests (4-6 hours)
**Current**: Only docker-compose.yml (not production-ready)  
**Target**: Full K8s deployment

**Required Manifests**:
- Deployments: backend, frontend, celery-worker, celery-beat
- Services: backend-svc, frontend-svc, redis-svc, postgres-svc
- ConfigMaps: env vars, app config
- Secrets: DB passwords, API keys, OAuth secrets
- Ingress: nginx/Traefik for routing
- PersistentVolumeClaims: Postgres data, model cache
- HorizontalPodAutoscaler: Auto-scaling

---

### 21. Add Monitoring Stack (3-4 hours)
**Current**: No monitoring, no observability  
**Target**: Full monitoring with alerts

**Components**:
- Prometheus: Metrics collection
- Grafana: Dashboards
- Loki: Log aggregation
- Tempo: Distributed tracing
- Alertmanager: Alert routing

**Dashboards to Create**:
- Backend performance (requests, latency, errors)
- Database performance (query time, connection pool)
- Celery tasks (queue size, task duration, failures)
- Frontend metrics (page load, API calls)

---

### 22. Add CI/CD Pipeline Improvements (2-3 hours)
**Current**: Builds Docker images, no tests, no security  
**Target**: Full CI/CD with tests and security

**Actions**:
1. Add test runs:
   - Backend: pytest with coverage report
   - Frontend: vitest with coverage report
   - Fail build if coverage <60%

2. Add security scanning:
   - Trivy: Docker image scanning
   - Snyk: Dependency scanning
   - SAST: Code security analysis

3. Add automated deployments:
   - Staging: Auto-deploy on main branch
   - Production: Manual approval gate

---

### 23. Optimize Docker Images (2-3 hours)
**Current**: Backend image ~5GB (models at build time)  
**Target**: <2GB, lazy model loading

**Actions**:
1. Multi-stage builds:
   - Build stage: Compile deps
   - Runtime stage: Only runtime deps

2. Lazy model loading:
   - Don't download models at build time
   - Load on-demand or via init container

3. Layer caching:
   - Order Dockerfile for optimal caching
   - Separate rarely-changed deps from code

**Expected Impact**:
- Build time: 20-30min → 5-10min
- Image size: 5GB → 1.5-2GB
- Cold start: Same (models still need download)

---

## Priority 6: Code Quality Improvements (1-2 hours each)

### 24. Replace print() with Structured Logging (1-2 hours)
**Current**: 86 print() statements in backend  
**Target**: Structured logging with log levels

**Top Files** (by print count):
- `app/services/connector_service.py`: 25 occurrences
- `app/agents/podcaster/nodes.py`: 10 occurrences
- `app/connectors/luma_connector.py`: 9 occurrences
- `app/agents/new_chat/llm_config.py`: 7 occurrences

**Actions**:
1. Create `app/logging_config.py` with structured logger
2. Replace all `print()` with `logger.info()`, `logger.debug()`, etc.
3. Add log context (request_id, user_id, search_space_id)

---

### 25. Add Pre-commit Hooks (30 min)
**Current**: No automated code quality checks  
**Target**: Enforce formatting, linting, types

**Hooks to Add**:
- ruff: Python linting and formatting
- mypy: Type checking
- isort: Import sorting
- prettier: Frontend formatting
- eslint: Frontend linting

**Setup**:
```bash
cd surfsense_backend
pre-commit install
```

---

### 26. Add Custom Exception Classes (1-2 hours)
**Current**: 18 bare `except Exception:` handlers  
**Target**: Custom exception hierarchy

**Create** `app/exceptions.py`:
```python
class SurfSenseException(Exception): pass
class ConnectorException(SurfSenseException): pass
class AuthenticationException(SurfSenseException): pass
class PermissionException(SurfSenseException): pass
class ValidationException(SurfSenseException): pass
# ... etc
```

**Replace bare exceptions**:
```python
# OLD:
try:
    ...
except Exception as e:
    logger.error(f"Error: {e}")

# NEW:
try:
    ...
except ConnectorException as e:
    logger.error(f"Connector error: {e}", exc_info=True)
except ValidationException as e:
    logger.warning(f"Validation error: {e}")
```

---

## Priority 7: Documentation (1-2 hours each)

### 27. Document All Environment Variables (1 hour)
**Current**: Scattered across docker-compose.yml, .env.example  
**Target**: Single source of truth

**Create**: `ENVIRONMENT_VARIABLES.md`

**Sections**:
- Required variables (app won't start without)
- Optional variables (with defaults)
- Secret variables (need encryption)
- Per-environment overrides (dev/staging/prod)

---

### 28. Create Production Deployment Guide (2 hours)
**Current**: No deployment docs  
**Target**: Complete production deployment guide

**Create**: `DEPLOYMENT.md`

**Sections**:
- Prerequisites (K8s cluster, DNS, SSL certs)
- Infrastructure setup (DB, Redis, S3)
- Secrets management (Vault, AWS Secrets Manager)
- Deployment steps (kubectl apply)
- Monitoring setup (Prometheus, Grafana)
- Backup and restore procedures
- Rollback procedures
- Scaling guidelines

---

### 29. Create API Documentation (2-3 hours)
**Current**: No API docs  
**Target**: OpenAPI/Swagger docs

**Actions**:
1. Add FastAPI auto-documentation:
   ```python
   app = FastAPI(
       title="SurfSense API",
       description="...",
       version="1.0.0",
       docs_url="/api/docs",
       redoc_url="/api/redoc",
   )
   ```

2. Add docstrings to all routes
3. Add Pydantic models for request/response validation
4. Export OpenAPI schema: `/api/openapi.json`

---

## Summary Statistics

**Total Long Tasks**: 29 tasks

**By Time Estimate**:
- 30-45 min: 5 tasks
- 1-2 hours: 8 tasks
- 2-3 hours: 8 tasks
- 3-4 hours: 4 tasks
- 4-6 hours: 3 tasks
- 6-8 hours: 1 task

**By Priority**:
- P0 (Complete in-progress): 1 task (15 min)
- P1 (Frontend heavy): 7 tasks (~18 hours)
- P2 (Backend heavy): 5 tasks (~20 hours)
- P3 (Performance): 3 tasks (~2 hours)
- P4 (Testing): 3 tasks (~7 hours)
- P5 (Infrastructure): 4 tasks (~14 hours)
- P6 (Code quality): 3 tasks (~4 hours)
- P7 (Documentation): 3 tasks (~5 hours)

**Total Estimated Time**: ~70 hours

**Timeline**:
- Full-time (40 hrs/week): 1.75 weeks
- Part-time (20 hrs/week): 3.5 weeks
- Side project (10 hrs/week): 7 weeks

---

## Next Steps

1. **IMMEDIATE** (15 min): Complete Chat page refactoring
2. **Quick Wins** (2-3 hours): Database indexes + connection pool + N+1 fixes
3. **Heavy Tasks** (choose track):
   - Frontend track: assistant-ui thread → connectors page → sidebar
   - Backend track: connector service → RBAC routes → file processors
   - Infrastructure track: K8s → monitoring → CI/CD

**Recommendation**: Start with Performance Quick Wins (P3) - highest impact for lowest time investment.

