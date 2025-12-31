# Chat Page Refactoring (Partial) - In Progress

## Overview
**Target**: `surfsense_web/app/dashboard/[search_space_id]/new-chat/[[...chat_id]]/page.tsx`
**Original Size**: 923 lines
**Status**: Utility extraction complete, main page update pending

## What Was Completed ✅

### 1. Extracted Utility Functions (183 lines)
**File**: `surfsense_web/lib/chat/chat-utils.tsx`

**Extracted Functions**:
- `extractThinkingSteps(content: unknown): ThinkingStep[]` - Parses thinking-steps from message content
- `extractMentionedDocuments(content: unknown): MentionedDocumentInfo[]` - Parses mentioned documents with Zod schema validation
- `extractPersistedAttachments(content: unknown): PersistedAttachment[]` - Parses attachments with Zod schema validation
- `convertToThreadMessage(msg: MessageRecord): ThreadMessageLike` - Converts backend message format to assistant-ui format
- `TOOLS_WITH_UI` constant - Set of tools that render custom UI (generate_podcast, link_preview, display_image, scrape_webpage, write_todos)

**Exported Types**:
- `PersistedAttachment` interface
- `MentionedDocumentInfo` interface
- `MessageRecord` interface

### 2. Extracted Thread Initialization Hook (130 lines)
**File**: `surfsense_web/hooks/use-thread-initializer.ts`

**Hook**: `useThreadInitializer(urlChatId: number)`

**Returns**:
- `isInitializing: boolean` - Loading state for initial load
- `threadId: number | null` - Current thread ID (null for new chats)
- `setThreadId: (id: number | null) => void` - Setter for thread ID
- `messages: ThreadMessageLike[]` - Array of loaded messages
- `setMessages: (msgs: ThreadMessageLike[]) => void` - Setter for messages
- `messageThinkingSteps: Map<string, ThinkingStep[]>` - Map of message ID to thinking steps
- `setMessageThinkingSteps: (map: Map<string, ThinkingStep[]>) => void` - Setter for thinking steps
- `initializeThread: () => Promise<void>` - Function to reinitialize thread

**Functionality**:
- Loads existing thread messages on mount
- Restores thinking steps from persisted messages
- Restores mentioned documents from persisted messages
- Hydrates write_todos plan state
- Resets all state when switching chats
- Implements lazy thread creation (no thread created until first message sent)

## What Remains To Do ⏳

### 3. Update Main Chat Page (Pending)
**File**: `surfsense_web/app/dashboard/[search_space_id]/new-chat/[[...chat_id]]/page.tsx`

**Required Changes**:
1. Add imports:
   ```typescript
   import {
       TOOLS_WITH_UI,
       convertToThreadMessage,
       extractThinkingSteps,
       extractMentionedDocuments,
       type MentionedDocumentInfo,
   } from "@/lib/chat/chat-utils";
   import { useThreadInitializer } from "@/hooks/use-thread-initializer";
   ```

2. Remove lines 57-205:
   - Remove inline `extractThinkingSteps` function (lines 57-73)
   - Remove inline `extractMentionedDocuments` function (lines 88-105)
   - Remove inline `extractPersistedAttachments` function (lines 123-138)
   - Remove inline `convertToThreadMessage` function (lines 141-197)
   - Remove inline `TOOLS_WITH_UI` constant (lines 199-205)

3. Remove `initializeThread` callback (lines 269-338) and replace with hook:
   ```typescript
   // OLD:
   const [isInitializing, setIsInitializing] = useState(true);
   const [threadId, setThreadId] = useState<number | null>(null);
   const [messages, setMessages] = useState<ThreadMessageLike[]>([]);
   const [messageThinkingSteps, setMessageThinkingSteps] = useState<Map<string, ThinkingStep[]>>(new Map());
   const initializeThread = useCallback(async () => { /* 70 lines of code */ }, [deps]);
   useEffect(() => { initializeThread(); }, [initializeThread]);

   // NEW:
   const {
       isInitializing,
       threadId,
       setThreadId,
       messages,
       setMessages,
       messageThinkingSteps,
       setMessageThinkingSteps,
       initializeThread,
   } = useThreadInitializer(urlChatId);
   ```

4. Remove unused imports:
   - Remove `import { z } from "zod";` (moved to chat-utils.tsx)
   - Remove `import { clearPlanOwnerRegistry }` (moved to hook)
   - Remove `import { getThreadMessages }` (moved to hook)
   - Remove `import type { MessageRecord }` (now imported from chat-utils)

**Expected Result**:
- Main page: 923 → ~780 lines (15% reduction)
- Cleaner, more focused component
- Better separation of concerns
- Reusable utilities and hook

## Why This Approach?

**Chat Page is Different from Logs/Team Pages**:
- Contains 400+ lines of complex streaming logic in `onNew` callback
- Tightly coupled SSE parsing, state updates, tool call handling
- Extracting streaming logic would make code harder to follow
- Better to keep streaming logic inline for clarity

**What We Did Extract**:
1. **Pure utility functions** (no dependencies, easily testable)
2. **Initialization logic** (clear lifecycle, reusable pattern)

**What We Kept Inline**:
1. **Streaming SSE parser** (400+ lines, tightly coupled to component state)
2. **Message sending logic** (complex fetch with attachments, mentions, history)
3. **Tool call handling** (inline in streaming for performance)

## Build Status

**Files Created**:
- ✅ `surfsense_web/lib/chat/chat-utils.tsx` (183 lines)
- ✅ `surfsense_web/hooks/use-thread-initializer.ts` (130 lines)

**Files Modified**:
- ⏸️ `surfsense_web/app/dashboard/[search_space_id]/new-chat/[[...chat_id]]/page.tsx` - PENDING

**Build**: Not yet tested (page not updated)

## Next Steps

1. **Update main Chat page** (15 min):
   - Add imports for chat-utils and hook
   - Remove lines 57-205 (utility functions)
   - Replace initialization code with useThreadInitializer hook
   - Remove unused imports

2. **Test build** (2 min):
   ```bash
   cd surfsense_web && pnpm build
   ```

3. **Manual testing** (optional):
   - Open new chat, verify it loads
   - Send message, verify streaming works
   - Upload attachment, verify it displays
   - Mention document, verify it's included
   - Refresh page, verify messages persist

## Files Location

```
surfsense_web/
├── lib/chat/
│   └── chat-utils.tsx               # ✅ Created (183 lines)
├── hooks/
│   └── use-thread-initializer.ts     # ✅ Created (130 lines)
└── app/dashboard/[search_space_id]/new-chat/[[...chat_id]]/
    └── page.tsx                      # ⏸️ Pending update (923 lines)
```

**Backup**: `/tmp/chat_page_backup.tsx` (original 923-line file)

## Summary

**Progress**: 60% complete (extraction done, main page update pending)
**Lines Extracted**: 313 lines (183 utils + 130 hook)
**Expected Final Reduction**: ~143 lines (15% reduction)
**Approach**: Conservative refactoring - extract utilities and initialization, keep complex streaming logic inline

---

**Created**: 2024-12-31  
**Status**: Partial - utilities extracted, main page update pending  
**Next Agent**: Update main Chat page to use extracted utilities and hook
