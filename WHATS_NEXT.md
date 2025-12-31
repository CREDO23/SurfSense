# 🚀 What's Next - SurfSense Refactoring Roadmap

**Date**: December 31, 2024  
**Status**: Backend heavy tasks complete ✅ | Frontend & Performance pending 📋

---

## 🎯 Quick Summary

### ✅ Completed (Last Session)

**Backend Heavy Tasks Refactoring** - All 3 files DONE:
- ✅ `file_processors.py` (1,069 → 654 lines, -39%)
- ✅ `stream_new_chat.py` (1,061 → 221 lines, -79%)
- ✅ `connector_tasks.py` (688 → 567 lines across 17 files)

**Total**: 2,818 → 1,442 lines (-49%, -1,376 lines) + 30 new modular files

---

## 📊 Priority Matrix

### 🔴 CRITICAL (Do First)

#### 1. Fix Logs Pagination Bug (30 min) 🐛
**File**: `surfsense_web/hooks/use-logs.ts:88-91`  
**Issue**: Hardcoded `limit: 5` - users can only see 5 logs  
**Impact**: HIGH - User-facing bug, breaks pagination  
**Fix**: Add pagination params to `useLogs()` hook

```typescript
// Current (BROKEN):
queryFn: () => logsApiService.getLogs({
  queryParams: {
    search_space_id: searchSpaceId,
    skip: 0,
    limit: 5,  // ← HARDCODED!
  }
})

// Fix:
export function useLogs(
  searchSpaceId?: number,
  pagination?: { skip: number; limit: number }
) {
  const skip = pagination?.skip ?? 0;
  const limit = pagination?.limit ?? 20;
  // ...
}
```

**Documentation**: Already analyzed in previous mementos  
**Estimated Time**: 30 minutes

---

#### 2. Add Database Indexes (1-2 hours) ⚡
**Impact**: CRITICAL - 60-80% faster queries  
**Files**: 
- `surfsense_backend/alembic/versions/` (create new migration)
- `surfsense_backend/app/db.py` (models)

**Missing Indexes** (from `PERFORMANCE_TODOS.md`):
```sql
CREATE INDEX idx_documents_space_type ON documents(search_space_id, document_type);
CREATE INDEX idx_chunks_document_id ON chunks(document_id);
CREATE INDEX idx_chat_threads_space_archived ON new_chat_threads(search_space_id, archived);
CREATE INDEX idx_membership_user ON search_space_memberships(user_id);
CREATE INDEX idx_membership_space_role ON search_space_memberships(search_space_id, role_id);
```

**Steps**:
1. Create Alembic migration: `alembic revision -m "add_performance_indexes"`
2. Add CREATE INDEX statements to `upgrade()`
3. Add DROP INDEX statements to `downgrade()`
4. Test migration: `alembic upgrade head`
5. Verify indexes: `\di` in psql

**Expected Gains**: List endpoints 80% faster (500ms → 100ms)

---

#### 3. Fix N+1 Queries (2-3 hours) ⚡
**Impact**: HIGH - Eliminates hundreds of redundant DB queries  
**Files**:
- `surfsense_backend/app/routes/search_spaces_routes.py:108-180` (read_search_spaces)
- `surfsense_backend/app/routes/documents_routes.py:195-292` (list documents)

**Problem**: Loading relationships in loops instead of eager loading

**Fix Example**:
```python
# Bad (N+1 - fires 1 + N queries):
search_spaces = await session.execute(select(SearchSpace))
for space in search_spaces:
    members = await session.execute(
        select(Member).filter(space_id=space.id)
    )

# Good (1 query total):
search_spaces = await session.execute(
    select(SearchSpace)
    .options(
        selectinload(SearchSpace.memberships),
        selectinload(SearchSpace.llm_configs),
    )
)
```

**Expected Gains**: 70-90% faster (10 queries → 1 query)

---

### 🟡 HIGH PRIORITY (Next Week)

#### 4. Add Unit Tests (0% coverage) 🧪
**Impact**: HIGH - Enable safe refactoring  
**Current**: No tests for refactored code  
**Target**: 60% coverage

**Test Files to Create**:

**Backend Tests** (create in `surfsense_backend/tests/`):
```
tests/
├── conftest.py                          # Fixtures
├── unit/
│   ├── tasks/
│   │   ├── document_processors/
│   │   │   ├── test_base_file_processor.py
│   │   │   ├── test_unstructured_processor.py
│   │   │   ├── test_llamacloud_processor.py
│   │   │   └── test_docling_processor.py
│   │   ├── chat/
│   │   │   ├── test_state_tracker.py
│   │   │   ├── test_event_handlers.py
│   │   │   └── test_context_formatters.py
│   │   └── celery_tasks/
│   │       ├── test_base_connector_task.py
│   │       └── test_slack_connector.py
│   └── services/
│       └── test_connector_service.py
└── integration/
    ├── test_file_upload_flow.py
    └── test_chat_streaming.py
```

**Frontend Tests** (create in `surfsense_web/tests/`):
```
tests/
├── hooks/
│   ├── use-logs.test.tsx               # Already exists ✅
│   ├── use-connector-edit-page.test.tsx  # NEW
│   └── use-search-source-connectors.test.tsx  # NEW
└── components/
    ├── connector-form.test.tsx         # NEW
    └── logs-table.test.tsx             # NEW
```

**Steps**:
1. Fix backend pytest dependency: `pip install "langgraph[postgres]"`
2. Create test fixtures in `conftest.py`
3. Write unit tests for each refactored module
4. Add integration tests for critical flows
5. Run tests in CI/CD pipeline

**Estimated Time**: 1-2 weeks (part-time)

---

#### 5. Frontend Component Refactoring (2-3 weeks) 🎨
**Impact**: HIGH - Eliminate 5,000+ lines of duplication  
**Documentation**: See `FRONTEND_DEEP_ANALYSIS.md`

**Priority Files**:

**Week 1: Giant Components**
- `contracts/enums/llm-models.ts` (1,478 lines) → Generate from API
- `app/dashboard/[search_space_id]/team/page.tsx` (1,472 lines) → Split into 5 components
- `app/dashboard/[search_space_id]/logs/(manage)/page.tsx` (1,231 lines) → Split into 4 components

**Week 2: Connector Forms**
- Extract generic `<ConnectorFormWizard/>` component
- Replace 15 duplicate connector pages (5,000+ lines → <1,000 lines)

**Week 3: Complex Hooks**
- `hooks/use-connector-edit-page.ts` (672 lines) → Split into 4 hooks
- `hooks/use-search-source-connectors.ts` (339 lines) → Extract cache + filters

**Expected Gains**: -7,000 lines, -350KB bundle size

---

### 🟢 MEDIUM PRIORITY (This Month)

#### 6. Add Connection Pool Configuration (30 min) ⚡
**File**: `surfsense_backend/app/db.py`  
**Issue**: Default pool settings, no async optimization  
**Impact**: Connection exhaustion under load

**Fix**:
```python
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,           # ← Add
    max_overflow=10,        # ← Add
    pool_pre_ping=True,     # ← Add (detect stale connections)
    pool_recycle=1800,      # ← Add (30 min)
    echo=False
)
```

**Expected Gains**: 70% fewer connections under load

---

#### 7. Add Redis Caching (3-4 hours) 🚀
**Files**: Create `surfsense_backend/app/services/cache_service.py`  
**Issue**: No caching for frequent queries  
**Impact**: Repeated DB queries for permissions, configs, search results

**Cache Targets**:
- User permissions (TTL: 5 min)
- Search space configs (TTL: 10 min)
- LLM configurations (TTL: 30 min)
- Search results (TTL: 1 hour)

**Implementation**:
```python
class CacheService:
    def __init__(self, redis_client):
        self.redis = redis_client
    
    async def get_user_permissions(self, user_id: int, space_id: int):
        key = f"perms:{user_id}:{space_id}"
        cached = await self.redis.get(key)
        if cached:
            return json.loads(cached)
        
        # Fetch from DB...
        await self.redis.setex(key, 300, json.dumps(perms))
        return perms
```

**Expected Gains**: 50-70% faster permission checks

---

#### 8. Optimize Hybrid Search (4-5 hours) ⚡
**File**: `surfsense_backend/app/retriever/chunks_hybrid_search.py`  
**Issue**: 3 separate DB queries per search (semantic, keyword, join)  
**Impact**: 3x latency

**Fix**: Implement single CTE-based query:
```sql
WITH semantic_results AS (
  SELECT chunk_id, embedding <-> query_embedding AS distance
  FROM chunks
  ORDER BY distance
  LIMIT 50
),
keyword_results AS (
  SELECT chunk_id, ts_rank(content_tsvector, to_tsquery(?)) AS rank
  FROM chunks
  WHERE content_tsvector @@ to_tsquery(?)
  LIMIT 50
)
SELECT ...
FROM semantic_results
FULL OUTER JOIN keyword_results USING (chunk_id)
ORDER BY rrf_score(semantic_results.rank, keyword_results.rank)
LIMIT 10;
```

**Expected Gains**: 60-70% faster search (1500ms → 450ms)

---

### ⚪ LOW PRIORITY (Nice to Have)

#### 9. Infrastructure Improvements 🏗️
**Documentation**: See `INFRASTRUCTURE_ANALYSIS.md`

**Missing Infrastructure**:
- No Kubernetes manifests (production deployment)
- No monitoring stack (Prometheus, Grafana, Loki)
- No secrets management (Vault, AWS Secrets Manager)
- CI doesn't run tests
- No security scanning (Trivy, Snyk)
- Backend Docker image too large (~5GB)

**Estimated Timeline**: 10 weeks (production-ready infrastructure)

---

#### 10. Add TypeScript Strict Mode (1 week) 🔒
**File**: `surfsense_web/tsconfig.json`  
**Issue**: `"strict": false` - Missing type safety

**Fix**:
```json
{
  "compilerOptions": {
    "strict": true,  // ← Enable
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

**Steps**:
1. Enable strict mode
2. Fix ~500 type errors (estimated)
3. Add proper null checks
4. Update all `any` types

---

## 📅 Recommended Timeline

### Week 1 (Critical Fixes - 8-10 hours)
- ✅ **Day 1**: Fix logs pagination bug (30 min)
- ✅ **Day 2-3**: Add database indexes (2 hours)
- ✅ **Day 4-5**: Fix N+1 queries (3 hours)
- ✅ **Day 5**: Add connection pool config (30 min)
- ✅ **Test everything**: 2 hours

**Expected Impact**: 70-80% performance improvement for list endpoints

### Week 2-3 (Testing - 20 hours)
- Fix backend pytest dependency
- Write unit tests for refactored modules
- Add integration tests
- Achieve 60% test coverage

### Week 4-6 (Frontend Refactoring - 40 hours)
- Refactor giant components (team, logs, chat)
- Extract generic connector form
- Split complex hooks
- Reduce bundle size by 350KB

### Week 7-8 (Performance - 15 hours)
- Add Redis caching layer
- Optimize hybrid search
- Implement asyncio.gather() for parallel operations

### Month 3+ (Infrastructure - Optional)
- Production deployment setup
- Monitoring & observability
- Security hardening

---

## 🎯 Quick Start Guide

### Option A: Performance First (Recommended)
**Goal**: Make the app 70% faster in 1 week

```bash
# 1. Fix logs bug (30 min)
cd surfsense_web
# Edit hooks/use-logs.ts, add pagination params
pnpm test && pnpm build

# 2. Add database indexes (2 hours)
cd ../surfsense_backend
alembic revision -m "add_performance_indexes"
# Edit migration file, add CREATE INDEX statements
alembic upgrade head

# 3. Fix N+1 queries (3 hours)
# Edit routes files, add selectinload()
python -m pytest tests/

# 4. Add connection pool (30 min)
# Edit app/db.py, configure pool
```

**Expected Result**: 70-80% faster queries, better UX

---

### Option B: Testing First (Safest)
**Goal**: Add test coverage to enable safe refactoring

```bash
# 1. Fix pytest dependency
cd surfsense_backend
pip install "langgraph[postgres]"

# 2. Create test fixtures
cat > tests/conftest.py << 'EOF'
import pytest
from app.db import get_session
# ... fixtures
