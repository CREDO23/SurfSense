# Micro-Tasks List (1-2 Minutes Each)

> **Goal**: Each task takes 1-2 minutes and accomplishes exactly 2 things
> **Format**: Clear, actionable, verifiable

---

## Database Tasks (1-2 min each)

### Task DB-1: Add First Two Database Indexes (2 min)
**Accomplishes**:
1. Create migration file
2. Add indexes for documents and chunks tables

**Execute**:
```bash
cd surfsense_backend
alembic revision -m "add_indexes_documents_chunks"
# Edit generated file, add upgrade/downgrade with 2 indexes
```

---

### Task DB-2: Add pool_pre_ping + pool_size (2 min)
**Accomplishes**:
1. Add pool_pre_ping=True to db.py
2. Add pool_size=20 to db.py

**File**: `surfsense_backend/app/db.py` line ~819
**Change**: Add both params to `create_async_engine()`

---

## Frontend Tasks (1-2 min each)

### Task FE-1: Fix Logs Pagination (Part 1) (2 min)
**Accomplishes**:
1. Add pagination parameter to hook signature
2. Extract skip/limit with defaults

**File**: `surfsense_web/hooks/use-logs.ts` line ~54

---

### Task FE-2: Fix Logs Pagination (Part 2) (1 min)
**Accomplishes**:
1. Replace hardcoded skip=0 with variable
2. Replace hardcoded limit=5 with variable

**File**: `surfsense_web/hooks/use-logs.ts` line ~90

---

## Configuration Tasks (1-2 min each)

### Task CFG-1: Create .editorconfig (1 min)
**Accomplishes**:
1. Create .editorconfig file
2. Add Python + TypeScript formatting rules

---

### Task CFG-2: Add max_overflow + pool_recycle (1 min)
**Accomplishes**:
1. Add max_overflow=10 to db.py
2. Add pool_recycle=1800 to db.py

**File**: `surfsense_backend/app/db.py`

---

## Code Cleanup Tasks (1-2 min each)

### Task CC-1: Fix Airtable TODO (1 min)
**Accomplishes**:
1. Remove TODO comment
2. Add explanatory comment

**File**: `surfsense_backend/app/connectors/airtable_connector.py:314`

---

### Task CC-2: Fix ClickUp TODO (2 min)
**Accomplishes**:
1. Remove TODO comment
2. Add date_updated params to API

**File**: `surfsense_backend/app/connectors/clickup_connector.py:171`

---

### Task CC-3: Fix Jira TODO (2 min)
**Accomplishes**:
1. Remove TODO comment
2. Improve JQL with date range

**File**: `surfsense_backend/app/connectors/jira_connector.py:243`

---

## Documentation Tasks (1-2 min each)

### Task DOC-1: Create .env.example (2 min)
**Accomplishes**:
1. Create .env.example file
2. Add DATABASE_URL + REDIS_URL

---

### Task DOC-2: Create CONTRIBUTING.md (2 min)
**Accomplishes**:
1. Create CONTRIBUTING.md
2. Add commit format + code style sections

---

## Git Commit Tasks (1-2 min each)

### Task GIT-1: Commit DB Changes (2 min)
**Accomplishes**:
1. Add db.py to git
2. Commit with message

---

### Task GIT-2: Commit Frontend Fix (2 min)
**Accomplishes**:
1. Add use-logs.ts to git
2. Commit with bug fix message

---

## Quick Win Path (14 minutes total)

1. **FE-1, FE-2** → Fix logs bug (3 min)
2. **DB-2, CFG-2** → Connection pool (3 min)
3. **CC-1, CC-2** → Clean 2 TODOs (3 min)
4. **CFG-1** → Add .editorconfig (1 min)
5. **GIT-1, GIT-2** → Commit (4 min)

**Total: 14 minutes, 10 improvements**
