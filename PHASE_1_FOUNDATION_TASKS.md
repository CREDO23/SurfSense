# Phase 1: Foundation Tasks (Week 1-2)

## Week 1: Testing Infrastructure

### Day 1-2: Backend Testing Setup
```bash
# Create test structure
cd surfsense_backend
mkdir -p tests/{unit,integration,fixtures}
touch tests/__init__.py
touch tests/conftest.py
touch tests/pytest.ini
```

**Files to create**:
1. `tests/conftest.py` - Database fixtures, mocks
2. `tests/pytest.ini` - pytest configuration
3. `tests/unit/test_example.py` - Example unit test

### Day 3: Frontend Testing Setup
```bash
cd surfsense_web
pnpm add -D vitest @testing-library/react @testing-library/jest-dom happy-dom
```

**Files to create**:
1. `vitest.config.ts` - Vitest configuration
2. `tests/setup.ts` - Test setup
3. `tests/example.test.tsx` - Example component test

### Day 4: Critical Bug Fixes
- [ ] Fix logs pagination bug (`hooks/use-logs.ts:88-91`) - 30 min
- [ ] Add database indexes (5 SQL statements) - 1 hour
- [ ] Uncomment Celery services (`docker-compose.yml:47-105`) - 2 hours

### Day 5: Security
- [ ] Add secrets management setup (AWS Secrets Manager)
- [ ] Configure SSL/TLS in docker-compose
- [ ] Remove exposed database ports

## Week 2: Validation & Preparation

### Day 1-2: Write First Tests
- [ ] Backend: Write 5 unit tests for existing code
- [ ] Frontend: Write 3 component tests
- [ ] Verify CI runs tests

### Day 3-4: Create Branch Strategy
- [ ] Set up feature flag system
- [ ] Define git branch naming convention
- [ ] Create PR templates

### Day 5: Go/No-Go Decision
- [ ] Review test infrastructure
- [ ] Confirm security hardening
- [ ] Get stakeholder approval for Phase 2

---

## Success Criteria

- ✅ pytest runs and passes
- ✅ Vitest runs and passes
- ✅ CI fails if tests fail
- ✅ Logs pagination bug fixed
- ✅ Database has indexes
- ✅ Celery services running separately
- ✅ Secrets not in plain text

**Then we're ready for heavy refactoring!**
