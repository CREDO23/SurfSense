# 📁 Test File Structure

**Generated**: January 2025
**Total Test Files**: ~150 files
**Backend Tests**: ~90 files
**Frontend Tests**: ~60 files

## 🐍 Backend Test Structure

surfsense_backend/tests/
├── conftest.py (P0)
├── pytest.ini (P0)
├── unit/ (250 tests)
│   ├── services/
│   │   ├── test_connector_service.py (65 tests)
│   │   ├── test_llm_service.py (18 tests)
│   │   └── test_page_limit_service.py (25 tests)
│   ├── connectors/ (45 tests)
│   ├── utils/ (35 tests)
│   ├── models/ (50 tests)
│   └── agents/ (40 tests)
├── integration/ (85 tests)
│   ├── routes/ (60 tests)
│   ├── database/ (15 tests)
│   └── celery_tasks/ (10 tests)
├── e2e/ (10 scenarios)
├── performance/ (10 tests)
├── security/ (10 tests)
└── regression/ (15 tests)

## 🎨 Frontend Test Structure

surfsense_web/tests/
├── setup.ts (P0)
├── vitest.config.ts (P0)
├── components/ (80 tests)
│   ├── team/ (15 tests)
│   ├── logs/ (12 tests)
│   ├── chat/ (13 tests)
│   ├── connectors/ (18 tests)
│   ├── documents/ (12 tests)
│   └── common/ (10 tests)
├── hooks/ (30 tests)
│   ├── use-logs.test.ts (8 tests - P0)
│   ├── use-connector-form.test.ts (12 tests)
│   └── use-search-source-connectors.test.ts (5 tests)
├── integration/ (45 tests)
│   ├── pages/ (25 tests)
│   └── state/ (20 tests)
├── e2e/ (10 scenarios)
│   ├── playwright.config.ts (P0)
│   ├── auth-flow.spec.ts
│   ├── document-lifecycle.spec.ts
│   ├── chat-conversation.spec.ts
│   └── logs.spec.ts (P0 - bug fix)
└── regression/ (10 tests)
