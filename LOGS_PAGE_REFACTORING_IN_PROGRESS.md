# Logs Page Refactoring - In Progress

## Status: 50% Complete

### Completed Components ✅

1. **MessageDetails.tsx** (63 lines) - Dialog for viewing log details
   - Location: `surfsense_web/components/logs/MessageDetails.tsx`
   - Status: ✅ Created and tested

2. **LogsSummaryDashboard.tsx** (169 lines) - Stats dashboard with 4 metrics cards
   - Location: `surfsense_web/components/logs/LogsSummaryDashboard.tsx`
   - Status: ✅ Created and tested

3. **LogsFilters.tsx** (237 lines) - Filter controls with search, level, status filters
   - Location: `surfsense_web/components/logs/LogsFilters.tsx`
   - Status: ✅ Created and tested

4. **logs-config.tsx** (204 lines) - Shared configuration: columns, icons, colors
   - Location: `surfsense_web/components/logs/logs-config.tsx`
   - Status: ✅ Created and tested

### Remaining Work 📋

**P0 - Critical Components** (Need to be extracted from lines 884-1231):

1. **LogsTable.tsx** (~180 lines)
   - Lines: 884-1063 in original page
   - Purpose: Main data table with loading/error/empty states
   - Dependencies: Tanstack Table, motion, UI components
   - Props: `table`, `logs`, `loading`, `error`, `onRefresh`, `id`, `t`

2. **LogRowActions.tsx** (~70 lines)
   - Lines: 1162-1231 in original page
   - Purpose: Row action menu (view metadata, delete)
   - Dependencies: LogsContext (for deleteLog, refreshLogs)
   - Props: `row`, `t`

3. **LogsPagination.tsx** (~100 lines)
   - Lines: 1064-1161 in original page
   - Purpose: Pagination controls with page size selector
   - Props: `table`, `id`, `t`

**P1 - Main Page Update**:

4. **Update page.tsx** (reduce from 1,231 → ~400 lines)
   - Remove extracted function definitions
   - Add component imports
   - Keep: LogsContext provider, table setup, main layout

**P2 - Bug Fix**:

5. **Fix pagination bug in use-logs.ts**
   - File: `surfsense_web/hooks/use-logs.ts:88-91`
   - Issue: Hardcoded `limit: 5` - users can only see 5 logs maximum
   - Fix: Add pagination parameter: `pagination?: { skip: number; limit: number }`
   - Change: `limit: pagination?.limit ?? 20`

### Architecture

```
surfsense_web/components/logs/
├── MessageDetails.tsx          ✅ (63 lines)
├── LogsSummaryDashboard.tsx    ✅ (169 lines)
├── LogsFilters.tsx             ✅ (237 lines)
├── logs-config.tsx             ✅ (204 lines) - Shared types, columns, icons
├── LogsTable.tsx               ⏳ (pending)
├── LogRowActions.tsx           ⏳ (pending)
└── LogsPagination.tsx          ⏳ (pending)
```

### Expected Impact

**Before**: 1,231 lines (monolithic page)
**After**: ~400-line page + 7 modular components (~950 total lines)
**Line Reduction**: ~23% overall reduction + massive readability improvement

### Next Steps for Continuation

1. **Extract LogsTable component**:
   ```bash
   cd /workspace/SurfSense/surfsense_web
   sed -n '884,1063p' app/dashboard/[search_space_id]/logs/(manage)/page.tsx
   ```

2. **Extract LogRowActions component**:
   ```bash
   sed -n '1162,1231p' app/dashboard/[search_space_id]/logs/(manage)/page.tsx
   ```

3. **Extract LogsPagination component**:
   ```bash
   sed -n '1064,1161p' app/dashboard/[search_space_id]/logs/(manage)/page.tsx
   ```

4. **Create LogsContext provider** (if not already inline):
   - Extract LogsContext from page.tsx
   - Make it reusable for LogRowActions

5. **Update main page**:
   - Remove all extracted function bodies
   - Add imports for all 6 components
   - Keep only: table setup, context provider, layout

6. **Fix pagination bug**:
   - File: `hooks/use-logs.ts`
   - Add pagination params to hook signature
   - Connect to API call

7. **Test build**:
   ```bash
   cd /workspace/SurfSense/surfsense_web
   pnpm build
   ```

8. **Create git commit**:
   ```bash
   git add -A
   git commit -m "refactor: Split 1,231-line Logs page into 7 modular components (23% reduction)"
   ```

### Components Created So Far

**Lines extracted**: 673 lines (MessageDetails + LogsSummaryDashboard + LogsFilters + logs-config)
**Original lines**: ~539 lines (after removing duplication/formatting)
**Progress**: 4/7 components complete (57%)

### References

- Original file: `surfsense_web/app/dashboard/[search_space_id]/logs/(manage)/page.tsx` (1,231 lines)
- Component directory: `surfsense_web/components/logs/`
- Related hook: `surfsense_web/hooks/use-logs.ts` (has pagination bug)

