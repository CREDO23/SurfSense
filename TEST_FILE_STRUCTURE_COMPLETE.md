# 📁 Test File Structure - Complete Directory Organization

**Generated**: January 2025  
**Total Test Files**: ~150 files  
**Backend Tests**: ~90 files  
**Frontend Tests**: ~60 files  
**Status**: Ready for implementation

---

## 📊 Test Counts Summary

| Area | Unit | Integration | E2E | Performance | Security | Regression | Total |
|------|------|-------------|-----|-------------|----------|------------|-------|
| **Backend** | 250 | 85 | 10 | 10 | 10 | 15 | **380** |
| **Frontend** | 110 | 45 | 10 | 5 | 0 | 10 | **180** |
| **TOTAL** | 360 | 130 | 20 | 15 | 10 | 25 | **560** |

---

## 🐍 Backend Test Structure (90 files)

### Directory Tree

```
surfsense_backend/tests/
├── conftest.py                        # P0 CRITICAL - Global fixtures
├── pytest.ini                         # P0 CRITICAL - Configuration
│
├── unit/                              # 250 unit tests
│   ├── __init__.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── test_connector_service.py  # 65 tests (P0)
│   │   ├── test_llm_service.py        # 18 tests (P0)
│   │   ├── test_page_limit_service.py # 25 tests (P1)
│   │   ├── test_document_service.py   # 15 tests (P1)
│   │   ├── test_auth_service.py       # 12 tests (P1)
│   │   ├── test_search_service.py     # 20 tests (P1)
│   │   └── test_rbac_service.py       # 13 tests (P1)
│   │
│   ├── connectors/                    # 45 tests
│   │   ├── __init__.py
│   │   ├── test_github_connector.py   # 3 tests (P1)
│   │   ├── test_notion_connector.py   # 3 tests (P1)
│   │   ├── test_slack_connector.py    # 3 tests (P1)
│   │   ├── test_google_drive_connector.py # 3 tests (P1)
│   │   └── ...                        # 15 connectors total
│   │
│   ├── utils/                         # 35 tests
│   │   ├── __init__.py
│   │   ├── test_validators.py         # 25 tests (P1)
│   │   ├── test_document_converters.py # 10 tests (P1)
│   │   ├── test_text_splitter.py      # 8 tests (P2)
│   │   └── test_embeddings.py         # 12 tests (P2)
│   │
│   ├── models/                        # 50 tests
│   │   ├── __init__.py
│   │   ├── test_user_model.py         # 5 tests (P1)
│   │   ├── test_search_space_model.py # 8 tests (P1)
│   │   ├── test_document_model.py     # 7 tests (P1)
│   │   ├── test_chunk_model.py        # 6 tests (P1)
│   │   └── ...                        # 14 models total
│   │
│   └── agents/                        # 40 tests
│       ├── __init__.py
│       ├── test_knowledge_base_tool.py # 12 tests (P1)
│       ├── test_search_tool.py        # 8 tests (P1)
│       ├── test_link_preview_tool.py  # 6 tests (P2)
│       └── test_podcaster_agent.py    # 14 tests (P2)
│
├── integration/                       # 85 tests
│   ├── __init__.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── test_search_spaces_routes.py # 10 tests (P0)
│   │   ├── test_documents_routes.py   # 10 tests (P0)
│   │   ├── test_new_chat_routes.py    # 8 tests (P0)
│   │   ├── test_rbac_routes.py        # 8 tests (P0)
│   │   ├── test_connector_routes.py   # 10 tests (P1)
│   │   ├── test_auth_routes.py        # 6 tests (P1)
│   │   └── test_search_routes.py      # 8 tests (P1)
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   ├── test_relationships.py      # 8 tests (P1)
│   │   ├── test_constraints.py        # 5 tests (P1)
│   │   └── test_migrations.py         # 2 tests (P2)
│   │
│   └── celery_tasks/
│       ├── __init__.py
│       ├── test_connector_tasks.py    # 4 tests (P1)
│       ├── test_document_tasks.py     # 3 tests (P1)
│       └── test_podcast_tasks.py      # 3 tests (P2)
│
├── e2e/                               # 10 scenarios
│   ├── __init__.py
│   ├── test_document_lifecycle.py     # 1 scenario (P0)
│   ├── test_search_flow.py            # 1 scenario (P0)
│   ├── test_connector_sync.py         # 1 scenario (P0)
│   ├── test_chat_conversation.py      # 1 scenario (P0)
│   └── test_team_management.py        # 1 scenario (P1)
│
├── performance/                       # 10 tests
│   ├── __init__.py
│   ├── test_api_performance.py        # 5 tests (P2)
│   ├── test_database_performance.py   # 3 tests (P2)
│   └── test_search_performance.py     # 2 tests (P2)
│
├── security/                          # 10 tests
│   ├── __init__.py
│   ├── test_auth.py                   # 10 tests (P2)
│   └── test_rbac.py                   # 5 tests (P2)
│
└── regression/                        # 15 tests
    ├── __init__.py
    └── test_critical_bugs.py          # 15 tests (P0 CRITICAL)
```

---

## 🎨 Frontend Test Structure (60 files)

### Directory Tree

```
surfsense_web/tests/
├── setup.ts                           # P0 CRITICAL - Global test setup
├── vitest.config.ts                   # P0 CRITICAL - Vitest configuration
│
├── components/                        # 80 tests
│   ├── team/
│   │   ├── members-list.test.tsx      # 5 tests (P1)
│   │   ├── roles-manager.test.tsx     # 5 tests (P1)
│   │   ├── invites-panel.test.tsx     # 3 tests (P1)
│   │   └── permissions-dialog.test.tsx # 2 tests (P1)
│   │
│   ├── logs/
│   │   ├── logs-filters.test.tsx      # 4 tests (P0)
│   │   ├── logs-table.test.tsx        # 5 tests (P0)
│   │   └── log-details-modal.test.tsx # 3 tests (P1)
│   │
│   ├── chat/
│   │   ├── chat-interface.test.tsx    # 6 tests (P0)
│   │   ├── message-list.test.tsx      # 4 tests (P0)
│   │   └── chat-input.test.tsx        # 3 tests (P1)
│   │
│   ├── connectors/
│   │   ├── connector-form-wizard.test.tsx # 8 tests (P1)
│   │   ├── github-form.test.tsx       # 3 tests (P1)
│   │   ├── notion-form.test.tsx       # 3 tests (P1)
│   │   └── connector-card.test.tsx    # 4 tests (P2)
│   │
│   ├── documents/
│   │   ├── document-list.test.tsx     # 5 tests (P1)
│   │   ├── document-upload.test.tsx   # 4 tests (P1)
│   │   └── document-viewer.test.tsx   # 3 tests (P2)
│   │
│   └── common/
│       ├── sidebar.test.tsx           # 4 tests (P2)
│       ├── header.test.tsx            # 3 tests (P2)
│       └── search-bar.test.tsx        # 3 tests (P2)
│
├── hooks/                             # 30 tests
│   ├── use-logs.test.ts               # 8 tests (P0 CRITICAL - BUG FIX)
│   ├── use-connector-form.test.ts     # 5 tests (P1)
│   ├── use-pat-validation.test.ts     # 3 tests (P1)
│   ├── use-repo-selection.test.ts     # 4 tests (P1)
│   ├── use-search-source-connectors.test.ts # 5 tests (P1)
│   ├── use-chat.test.ts               # 3 tests (P2)
│   └── use-documents.test.ts          # 2 tests (P2)
│
├── integration/                       # 45 tests
│   ├── pages/
│   │   ├── dashboard-home.test.tsx    # 5 tests (P1)
│   │   ├── documents-page.test.tsx    # 5 tests (P1)
│   │   ├── connectors-page.test.tsx   # 5 tests (P1)
│   │   ├── team-page.test.tsx         # 5 tests (P1)
│   │   └── settings-page.test.tsx     # 5 tests (P2)
│   │
│   └── state/
│       ├── atoms.test.ts              # 10 tests (P2)
│       └── stores.test.ts             # 10 tests (P2)
│
├── e2e/                               # 10 scenarios
│   ├── playwright.config.ts           # P0 CRITICAL - Playwright config
│   ├── fixtures/
│   │   └── test-document.pdf          # Test data
│   │
│   ├── auth-flow.spec.ts              # 3 tests (P0)
│   ├── document-lifecycle.spec.ts     # 5 tests (P0)
│   ├── chat-conversation.spec.ts      # 3 tests (P0)
│   ├── connector-oauth.spec.ts        # 2 tests (P1)
│   ├── team-management.spec.ts        # 3 tests (P1)
│   ├── document-editor.spec.ts        # 3 tests (P1)
│   ├── logs.spec.ts                   # 4 tests (P0 - BUG FIX)
│   ├── llm-config.spec.ts             # 3 tests (P2)
│   ├── podcast.spec.ts                # 2 tests (P2)
│   └── search-advanced.spec.ts        # 4 tests (P2)
│
└── regression/                        # 10 tests
    └── frontend-regressions.test.tsx  # 10 tests (P0 CRITICAL)
```

---

## 🎯 Priority Files (Must Create First)

### Week 1 - Foundation (P0)

**Backend:**
1. `tests/conftest.py` - Global fixtures
2. `tests/pytest.ini` - Configuration
3. `tests/regression/test_critical_bugs.py` - 15 regression tests

**Frontend:**
1. `tests/setup.ts` - Global test setup
2. `tests/vitest.config.ts` - Configuration
3. `tests/hooks/use-logs.test.ts` - 8 tests (BUG FIX)
4. `tests/regression/frontend-regressions.test.tsx` - 10 tests

### Week 2 - Core Services (P0)

**Backend:**
5. `tests/unit/services/test_connector_service.py` - 65 tests
6. `tests/unit/services/test_llm_service.py` - 18 tests
7. `tests/integration/routes/test_search_spaces_routes.py` - 10 tests
8. `tests/integration/routes/test_documents_routes.py` - 10 tests

**Frontend:**
5. `tests/components/logs/logs-table.test.tsx` - 5 tests
6. `tests/components/chat/chat-interface.test.tsx` - 6 tests
7. `tests/e2e/playwright.config.ts` - Configuration
8. `tests/e2e/logs.spec.ts` - 4 E2E tests

---

## 📋 Test File Naming Conventions

### Backend (Python)
- **Pattern**: `test_<module_name>.py`
- **Examples**: 
  - `test_connector_service.py`
  - `test_github_connector.py`
  - `test_search_spaces_routes.py`
- **Location**: Mirror source structure
  - `app/services/connector_service.py` → `tests/unit/services/test_connector_service.py`
  - `app/routes/documents_routes.py` → `tests/integration/routes/test_documents_routes.py`

### Frontend (TypeScript/React)
- **Pattern**: `<name>.test.{ts|tsx}`
- **Examples**:
  - `use-logs.test.ts` (hooks)
  - `logs-table.test.tsx` (components)
  - `auth-flow.spec.ts` (E2E)
- **Location**: Parallel to tests directory
  - `hooks/use-logs.ts` → `tests/hooks/use-logs.test.ts`
  - `components/logs/table.tsx` → `tests/components/logs/logs-table.test.tsx`

---

## ✅ Implementation Checklist

### Phase 1: Foundation (Week 1-2) - 45 tests
- [ ] Backend: Create conftest.py with fixtures
- [ ] Backend: Create pytest.ini configuration
- [ ] Backend: Write 15 regression tests (critical bugs)
- [ ] Frontend: Create setup.ts with mocks
- [ ] Frontend: Create vitest.config.ts
- [ ] Frontend: Create playwright.config.ts
- [ ] Frontend: Write 8 use-logs hook tests (BUG FIX)
- [ ] Frontend: Write 10 regression tests
- [ ] Set up CI/CD pipeline (GitHub Actions)
- **Target Coverage**: 10-15%

### Phase 2: Core Services (Week 3-4) - 113 tests
- [ ] Backend: Write 65 connector service tests
- [ ] Backend: Write 18 LLM service tests
- [ ] Backend: Write 20 route integration tests
- [ ] Frontend: Write 10 critical component tests
- **Target Coverage**: 25-30%

### Phase 3: Comprehensive (Week 5-8) - 250 tests
- [ ] Backend: Complete all unit tests (250 total)
- [ ] Backend: Complete all integration tests (85 total)
- [ ] Frontend: Complete component tests (80 total)
- [ ] Frontend: Complete hook tests (30 total)
- **Target Coverage**: 50-60%

### Phase 4: E2E & Specialized (Week 9-12) - 155 tests
- [ ] Backend: E2E scenarios (10)
- [ ] Frontend: E2E scenarios (10)
- [ ] Performance tests (15)
- [ ] Security tests (10)
- **Target Coverage**: 60-70%

---

## 📊 Coverage Goals by Area

| Component | Target Coverage | Critical Files |
|-----------|----------------|----------------|
| **Backend Services** | 80% | connector_service.py, llm_service.py |
| **Backend Routes** | 70% | All route files |
| **Backend Models** | 60% | All model classes |
| **Frontend Hooks** | 80% | use-logs.ts, use-connector-edit-page.ts |
| **Frontend Components** | 60% | Team, Logs, Chat components |
| **E2E Flows** | 100% | All critical user journeys |

---

**Document Status**: ✅ COMPLETE  
**Last Updated**: January 2025  
**Total Files to Create**: ~150 test files  
**Estimated Timeline**: 12 weeks
