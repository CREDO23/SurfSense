# 🏋️ Heavy Tasks Execution Plan

**Focus**: Long-running, high-impact refactoring tasks
**Timeline**: 12-16 weeks
**Impact**: Maximum code quality & performance improvement

---

## 🎯 Philosophy: Heavy Tasks First

**Why tackle heavy tasks?**
- ✅ Biggest bang for buck (remove 14,000+ lines)
- ✅ Unblock future work (modular structure enables parallel dev)
- ✅ Reduce technical debt significantly
- ✅ Improve onboarding & maintainability dramatically

**Strategy**: Start with the hardest, most impactful work while you have momentum

---

## 📊 Heavy Tasks Ranked by Impact

| Rank | Task | Effort | Lines Changed | Impact Score |
|------|------|--------|---------------|-------------|
| 🥇 1 | Split ConnectorService (2,508 lines) | 4 weeks | -2,000 | ⭐⭐⭐⭐⭐ |
| 🥈 2 | Split Connector Routes (1,766 lines) | 3 weeks | -1,500 | ⭐⭐⭐⭐⭐ |
| 🥉 3 | Refactor Connector Forms (15+ files) | 2 weeks | -4,000 | ⭐⭐⭐⭐⭐ |
| 4 | Split Database Models (976 lines) | 2 weeks | -800 | ⭐⭐⭐⭐ |
| 5 | Add Test Coverage (0% → 60%) | 4 weeks | +3,000 | ⭐⭐⭐⭐⭐ |
| 6 | Split Large Frontend Pages (5 pages) | 2 weeks | -3,000 | ⭐⭐⭐⭐ |
| 7 | Kubernetes Migration | 3 weeks | N/A | ⭐⭐⭐⭐ |

**Total**: 20 weeks, ~14,000 lines removed, +3,000 lines tests

---

## 🗓️ EXECUTION TIMELINE

### Phase 1: Foundation (Week 1-2) ⚡ PREREQUISITE

**Goal**: Set up infrastructure to safely do heavy refactoring

#### Week 1: Testing Infrastructure + Critical Fixes

**Day 1-2: Set Up Testing**
```bash
# Backend: pytest infrastructure
cd surfsense_backend
mkdir -p tests/{unit,integration,fixtures}
touch tests/conftest.py tests/pytest.ini

# Create database test fixtures
cat > tests/conftest.py << 'PYTEST'
import asyncio
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.db import Base

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def test_db():
    engine = create_async_engine("postgresql+asyncpg://test:test@localhost/test_db")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def session(test_db):
    async with AsyncSession(test_db) as session:
        yield session
PYTEST

# Frontend: Vitest + React Testing Library
cd ../surfsense_web
pnpm add -D vitest @testing-library/react @testing-library/jest-dom happy-dom

cat > vitest.config.ts << 'VITEST'
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './tests/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
VITEST
```

**Day 3: Critical Bug Fixes**
- Fix logs pagination bug (30 min)
- Uncomment Celery services (2 hours)
- Add database indexes (1 hour)

**Day 4-5: Security Hardening**
- Add secrets management (AWS Secrets Manager or Vault)
- Configure SSL/TLS
- Remove exposed ports from docker-compose

**Deliverables**: ✅ Tests run, ✅ Critical bugs fixed, ✅ Security hardened

---

### Phase 2: Backend God Object Refactoring (Week 3-10) 🏋️ HEAVY

#### **HEAVY TASK #1: Split ConnectorService (Week 3-6)**

**File**: `surfsense_backend/app/services/connector_service.py` (2,508 lines)

**Effort**: 4 weeks (most complex task)
**Impact**: ⭐⭐⭐⭐⭐ Unblocks parallel development

**Week 3: Create Base Infrastructure**
```bash
# Create new directory structure
mkdir -p surfsense_backend/app/services/connectors/{web_search,internal}

touch surfsense_backend/app/services/connectors/{
__init__.py,
base.py,
registry.py,
_shared.py
}
```

**Implementation Steps**:

1. **Day 1-2: Create Base Class**
   - Extract common functionality to `base.py`
   - Define abstract `search()` method
   - Move shared RRF search logic
   - Test: Ensure base class works in isolation

2. **Day 3-5: Migrate First 3 Connectors** (Proof of concept)
   - GitHub service (120 lines)
   - Slack service (110 lines)
   - Notion service (140 lines)
   - **Write tests for each** (critical!)
   - Update routes to use new services
   - Feature flag: `USE_NEW_CONNECTOR_SERVICES=true`

**Week 4: Migrate Core Connectors**

3. **Day 1-5: Migrate 8 Connectors**
   - Linear (120 lines)
   - Jira (130 lines)
   - Google Calendar (130 lines)
   - Google Gmail (140 lines)
   - Discord (100 lines)
   - Confluence (110 lines)
   - ClickUp (110 lines)
   - Airtable (100 lines)
   - **Write tests for each**

**Week 5: Migrate Web Search + Remaining**

4. **Day 1-3: Web Search Connectors**
   - Tavily (80 lines)
   - LinkUp (80 lines)
   - Baidu (80 lines)
   - SearXNG (80 lines)
   - Elasticsearch (90 lines)

5. **Day 4-5: Finalize Migration**
   - Luma (120 lines)
   - Bookstack (100 lines)
   - Any remaining connectors
   - Create registry pattern
   - Update all route imports

**Week 6: Testing & Cutover**

6. **Day 1-3: Comprehensive Testing**
   - Integration tests for all connectors
   - End-to-end search tests
   - Performance benchmarks (before/after)
   - Load testing with 100 concurrent searches

7. **Day 4-5: Production Cutover**
   - Deploy to staging
   - Run parallel tests (old vs new implementation)
   - Gradual rollout: 10% → 50% → 100%
   - Monitor error rates & performance
   - Delete old `connector_service.py` 🎉

**Success Metrics**:
- ✅ 2,508 lines → 15 files (~150 lines each)
- ✅ 60%+ test coverage for connector services
- ✅ No regression in search quality
- ✅ Same or better performance

---

#### **HEAVY TASK #2: Split Connector Routes (Week 7-9)**

**File**: `surfsense_backend/app/routes/search_source_connectors_routes.py` (1,766 lines)

**Effort**: 3 weeks
**Impact**: ⭐⭐⭐⭐⭐ Enables per-connector route testing

**Week 7: Create Router Structure**

```bash
# Create new directory
mkdir -p surfsense_backend/app/routes/connectors

touch surfsense_backend/app/routes/connectors/{
__init__.py,
github_routes.py,
slack_routes.py,
notion_routes.py,
linear_routes.py,
jira_routes.py,
# ... etc for all 15+ connectors
}
```

**Implementation**:

1. **Day 1-2: Extract Base CRUD**
   - Create `connectors/base_routes.py`
   - Extract common patterns (list, create, update, delete)
   - Create generic connector router factory

2. **Day 3-5: Migrate 5 Connectors**
   - GitHub routes
   - Slack routes
   - Notion routes
   - Linear routes
   - Jira routes
   - **Write route tests for each**

**Week 8: Migrate Remaining Routes**

3. **Day 1-5: Migrate 10+ Connectors**
   - All remaining connector routes
   - OAuth callback routes
   - Webhook routes
   - Test coverage for each

**Week 9: Integration & Cleanup**

4. **Day 1-3: Update Main Router**
   - Import all new connector routes
   - Register with API router
   - Update OpenAPI docs
   - Verify all endpoints accessible

5. **Day 4-5: Testing & Cutover**
   - API integration tests
   - Postman/Insomnia collection
   - Deploy & monitor
   - Delete old routes file 🎉

**Success Metrics**:
- ✅ 1,766 lines → 15+ files (~100 lines each)
- ✅ 70%+ test coverage for routes
- ✅ All endpoints return 200/201
- ✅ OpenAPI docs auto-generated

---

#### **HEAVY TASK #4: Split Database Models (Week 10)**

**File**: `surfsense_backend/app/db.py` (976 lines)

**Effort**: 2 weeks
**Impact**: ⭐⭐⭐⭐ Cleaner imports, better organization

**Implementation**:

```bash
mkdir -p surfsense_backend/app/models

touch surfsense_backend/app/models/{
__init__.py,
base.py,
user.py,
search_space.py,
document.py,
chat.py,
connector.py,
rbac.py,
llm_config.py,
enums.py
}
```

**Day 1-3: Extract Models**
- Move each model to its own file
- Keep relationships working
- Update all imports across codebase (100+ files)

**Day 4-5: Testing**
- Database migration tests
- Relationship integrity tests
- Verify no circular imports

---

### Phase 3: Frontend Heavy Lifting (Week 11-14) 🏋️ HEAVY

#### **HEAVY TASK #3: Refactor Connector Forms (Week 11-12)**

**Files**: 15+ connector form pages (~5,000 lines total, 90% duplication)

**Effort**: 2 weeks
**Impact**: ⭐⭐⭐⭐⭐ Remove 4,000 duplicate lines!

**Week 11: Create Generic Form Component**

```typescript
// components/connectors/connector-form-wizard.tsx
export function ConnectorFormWizard({ 
  connector, 
  schema, 
  fields, 
  onSubmit 
}: ConnectorFormProps) {
  // Generic form logic that works for ALL connectors
}
```

**Implementation**:

1. **Day 1-2: Analyze Common Pattern**
   - Extract shared form structure
   - Identify variations per connector
   - Design schema-driven approach

2. **Day 3-5: Build Generic Component**
   - Form wizard with steps
   - Dynamic field rendering
   - Validation engine
   - Test with 3 connectors

**Week 12: Migrate All Connectors**

3. **Day 1-4: Convert 15+ Connector Pages**
   - Replace each page with generic component
   - Create connector schemas
   - Verify all fields work

4. **Day 5: Testing & Cleanup**
   - E2E tests for all connector forms
   - Delete old pages 🎉
   - **Result**: 5,000 lines → 1,000 lines

---

#### **HEAVY TASK #6: Split Large Pages (Week 13-14)**

**Files**: 
- `team/page.tsx` (1,472 lines)
- `logs/page.tsx` (1,231 lines)
- `new-chat/page.tsx` (923 lines)
- `assistant-ui/thread.tsx` (1,088 lines)

**Effort**: 2 weeks
**Impact**: ⭐⭐⭐⭐ Maintainability + testability

**Week 13: Split Team & Logs Pages**

```bash
# Create component directories
mkdir -p surfsense_web/components/{team,logs}
```

1. **Day 1-3: Split Team Page**
   - `<MembersList />` component
   - `<RolesManager />` component
   - `<InvitesPanel />` component
   - `<PermissionsDialog />` component
   - Write component tests

2. **Day 4-5: Split Logs Page**
   - `<LogsFilters />` component
   - `<LogsTable />` component
   - `<LogDetailsModal />` component
   - Fix pagination bug while refactoring

**Week 14: Split Chat Components**

3. **Day 1-3: Split Chat Page**
   - `<ChatContainer />` component
   - `<ChatSidebar />` component
   - `<ModelConfigPanel />` component

4. **Day 4-5: Split Thread Component**
   - `<MessageList />` component
   - `<MessageInput />` component
   - `<ThreadToolbar />` component
   - `<MentionPicker />` component

---

### Phase 4: Testing & Infrastructure (Week 15-18) 🧪

#### **HEAVY TASK #5: Add Test Coverage (Week 15-18)**

**Current**: 0% coverage
**Target**: 60% coverage

**Effort**: 4 weeks
**Impact**: ⭐⭐⭐⭐⭐ Prevent future bugs, enable safe refactoring

**Week 15-16: Backend Tests**

1. **Day 1-10: Write Tests**
   - Unit tests for all services (70% target)
   - Integration tests for all routes (60% target)
   - Database tests for models
   - Fixture factory patterns
   - Mock external APIs (GitHub, Slack, etc.)

**Week 17-18: Frontend Tests**

2. **Day 1-10: Write Tests**
   - Unit tests for hooks (70% target)
   - Component tests (40% target)
   - E2E tests for critical flows (Playwright)
   - Visual regression tests (optional)

---

### Phase 5: Infrastructure Heavy Lifting (Week 19-22) ☁️

#### **HEAVY TASK #7: Kubernetes Migration (Week 19-21)**

**Effort**: 3 weeks
**Impact**: ⭐⭐⭐⭐ Production-ready scalability

**Week 19: K8s Setup**

```bash
mkdir -p k8s/{base,overlays/{dev,staging,prod}}
```

1. **Day 1-5: Create Manifests**
   - Deployments (backend, frontend, workers)
   - Services (ClusterIP, LoadBalancer)
   - ConfigMaps & Secrets
   - PersistentVolumeClaims
   - Ingress (with SSL)

**Week 20: Database & StatefulSets**

2. **Day 1-5: Migrate Database**
   - PostgreSQL StatefulSet or RDS
   - Redis Sentinel for HA
   - Backup strategy
   - Migration scripts

**Week 21: Deploy & Monitor**

3. **Day 1-5: Production Deploy**
   - Deploy to staging K8s
   - Load testing
   - Deploy to production
   - Monitor for 1 week

**Week 22: Monitoring Stack**

4. **Day 1-5: Observability**
   - Prometheus + Grafana
   - Loki for logs
   - Alertmanager
   - Dashboards

---

## 📊 CUMULATIVE IMPACT TRACKER

### Code Metrics

| Metric | Before | After Phase 2 | After Phase 3 | Final |
|--------|--------|---------------|---------------|-------|
| **Backend lines** | 38,377 | 35,000 | 35,000 | 35,000 |
| **Frontend lines** | 47,758 | 47,758 | 40,758 | 40,758 |
| **Total lines** | 86,135 | 82,758 | 75,758 | 75,758 |
| **Reduction** | - | -3,377 | -10,377 | -10,377 |
| **Test lines** | 0 | +500 | +1,500 | +3,000 |
| **Test coverage** | 0% | 20% | 40% | 60% |

### Files Count

| Metric | Before | After |
|--------|--------|-------|
| **Files >1,000 lines** | 8 | 0 |
| **Files >500 lines** | 16 | 3 |
| **Average file size** | 210 lines | 150 lines |

### Performance

| Metric | Before | After |
|--------|--------|-------|
| **Database query time** | 500ms | 100ms (80% faster) |
| **Frontend bundle** | 2.5MB | 2.15MB (-350KB) |
| **Cold start time** | 15s | 8s |

---

## 🎯 WEEK-BY-WEEK CHECKLIST

### Week 1-2: Foundation ⚡
- [ ] Set up pytest infrastructure
- [ ] Set up Vitest infrastructure
- [ ] Fix logs pagination bug
- [ ] Uncomment Celery services
- [ ] Add secrets management
- [ ] Configure SSL/TLS
- [ ] Add database indexes

### Week 3-6: ConnectorService Split 🏋️
- [ ] Create base class & registry
- [ ] Migrate first 3 connectors (POC)
- [ ] Migrate 8 core connectors
- [ ] Migrate web search connectors
- [ ] Write tests (60% coverage)
- [ ] Production cutover
- [ ] Delete old file

### Week 7-9: Connector Routes Split 🏋️
- [ ] Create router structure
- [ ] Extract base CRUD patterns
- [ ] Migrate 5 connectors
- [ ] Migrate remaining 10+ connectors
- [ ] Update main router
- [ ] Write route tests (70% coverage)
- [ ] Delete old file

### Week 10: Database Models Split 🏋️
- [ ] Create models directory
- [ ] Extract 8 model files
- [ ] Update 100+ imports
- [ ] Test relationships
- [ ] Delete old db.py

### Week 11-12: Connector Forms Refactor 🏋️
- [ ] Analyze common pattern
- [ ] Build generic form wizard
- [ ] Create connector schemas
- [ ] Convert 15+ pages
- [ ] Write E2E tests
- [ ] Delete old pages (-4,000 lines)

### Week 13-14: Frontend Pages Split 🏋️
- [ ] Split team page (4 components)
- [ ] Split logs page (3 components)
- [ ] Split chat page (3 components)
- [ ] Split thread component (4 components)
- [ ] Write component tests

### Week 15-18: Test Coverage 🧪
- [ ] Backend unit tests (70%)
- [ ] Backend integration tests (60%)
- [ ] Frontend hook tests (70%)
- [ ] Frontend component tests (40%)
- [ ] E2E tests (Playwright)
- [ ] Achieve 60% overall coverage

### Week 19-22: Kubernetes & Monitoring ☁️
- [ ] Create K8s manifests
- [ ] Set up Ingress + SSL
- [ ] Migrate database to StatefulSet
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Set up Prometheus + Grafana
- [ ] Set up Loki + Alertmanager

---

## 🚨 RISK MITIGATION

### High-Risk Tasks

1. **ConnectorService Split** (Week 3-6)
   - **Risk**: Breaking 15+ integrations
   - **Mitigation**: Feature flags, gradual rollout, parallel testing

2. **Database Models Split** (Week 10)
   - **Risk**: Circular imports, broken relationships
   - **Mitigation**: Careful import management, comprehensive tests

3. **Kubernetes Migration** (Week 19-21)
   - **Risk**: Downtime, data loss
   - **Mitigation**: Blue-green deployment, database backups, rollback plan

### Rollback Plan

For each heavy task:
1. **Git branch strategy**: `feature/connector-service-split`
2. **Feature flags**: Toggle old/new implementation
3. **Monitoring**: Error rates, performance metrics
4. **Rollback triggers**: >5% error rate increase, >50% performance degradation
5. **Rollback time**: <5 minutes (flip feature flag)

---

## 💰 RESOURCE ALLOCATION

### Team Composition (Recommended)

**Option 1: Dedicated Team** (Faster)
- 2 Senior Backend Engineers (ConnectorService, Routes, Models)
- 1 Senior Frontend Engineer (Forms, Pages)
- 1 Mid-level Full-stack Engineer (Testing)
- 1 DevOps Engineer (K8s, Monitoring)

**Timeline**: 16 weeks
**Cost**: ~$160K (16 weeks × 5 engineers × $2K/week)

**Option 2: Part-time Team** (Budget-conscious)
- 1 Senior Full-stack Engineer (50% time)
- 1 Mid-level Engineer (100% time)
- 1 DevOps Engineer (25% time)

**Timeline**: 32 weeks (twice as long)
**Cost**: ~$80K

---

## 🎉 SUCCESS CRITERIA

### Phase Completion Criteria

**Phase 2 (Backend) Complete When**:
- ✅ No files >500 lines
- ✅ All connectors isolated
- ✅ 60%+ test coverage
- ✅ All routes return correct responses

**Phase 3 (Frontend) Complete When**:
- ✅ No pages >500 lines
- ✅ Connector forms <1,000 lines total
- ✅ 40%+ component test coverage
- ✅ Bundle size reduced by 350KB

**Phase 4 (Testing) Complete When**:
- ✅ 60%+ overall test coverage
- ✅ CI fails if tests fail
- ✅ All critical flows have E2E tests

**Phase 5 (Infrastructure) Complete When**:
- ✅ K8s cluster running
- ✅ 99.9% uptime SLA
- ✅ Auto-scaling configured
- ✅ Monitoring & alerting live

---

## 🚀 READY TO START?

This plan focuses on the **7 heaviest tasks** that will transform your codebase:

1. ✅ Split ConnectorService (2,508 lines)
2. ✅ Split Connector Routes (1,766 lines)
3. ✅ Refactor Connector Forms (-4,000 duplicate lines)
4. ✅ Split Database Models (976 lines)
5. ✅ Add Test Coverage (0% → 60%)
6. ✅ Split Large Pages (-3,000 lines)
7. ✅ Kubernetes Migration (production-ready)

**Total Impact**: -10,377 lines, +3,000 test lines, production-ready infrastructure

**Next Command**: Choose your starting point! 🎯
