import { useCallback, useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { toast } from "sonner";
import {
	mentionedDocumentIdsAtom,
	mentionedDocumentsAtom,
	messageDocumentsMapAtom,
	type MentionedDocumentInfo,
} from "@/atoms/chat/mentioned-documents.atom";
import {
	clearPlanOwnerRegistry,
	extractWriteTodosFromContent,
	hydratePlanStateAtom,
} from "@/atoms/chat/plan-state.atom";
import type { ThinkingStep } from "@/components/tool-ui/deepagent-thinking";
import {
	convertToThreadMessage,
	extractThinkingSteps,
	extractMentionedDocuments,
	type MessageRecord,
} from "@/lib/chat/chat-utils";
import { getThreadMessages } from "@/lib/chat/thread-persistence";

/**
 * Custom hook to handle chat thread initialization and message loading
 * Manages state reset, message restoration, and metadata hydration
 */
export function useThreadInitializer(urlChatId: number) {
	const [isInitializing, setIsInitializing] = useState(true);
	const [threadId, setThreadId] = useState<number | null>(null);
	const [messages, setMessages] = useState<ThreadMessageLike[]>([]);
	const [messageThinkingSteps, setMessageThinkingSteps] = useState<Map<string, ThinkingStep[]>>(
		new Map()
	);

	const setMentionedDocumentIds = useSetAtom(mentionedDocumentIdsAtom);
	const setMentionedDocuments = useSetAtom(mentionedDocumentsAtom);
	const setMessageDocumentsMap = useSetAtom(messageDocumentsMapAtom);
	const hydratePlanState = useSetAtom(hydratePlanStateAtom);

	const initializeThread = useCallback(async () {
		setIsInitializing(true);

		// Reset all state when switching between chats to prevent stale data
		setMessages([]);
		setThreadId(null);
		setMessageThinkingSteps(new Map());
		setMentionedDocumentIds([]);
		setMentionedDocuments([]);
		setMessageDocumentsMap({});
		clearPlanOwnerRegistry(); // Reset plan ownership for new chat

		try {
			if (urlChatId > 0) {
				// Thread exists - load messages
				setThreadId(urlChatId);
				const response = await getThreadMessages(urlChatId);
				if (response.messages && response.messages.length > 0) {
					const loadedMessages = response.messages.map(convertToThreadMessage);
					setMessages(loadedMessages);

					// Extract and restore thinking steps from persisted messages
					const restoredThinkingSteps = new Map<string, ThinkingStep[]>();
					// Extract and restore mentioned documents from persisted messages
					const restoredDocsMap: Record<string, MentionedDocumentInfo[]> = {};

					for (const msg of response.messages as MessageRecord[]) {
						if (msg.role === "assistant") {
							const steps = extractThinkingSteps(msg.content);
							if (steps.length > 0) {
								restoredThinkingSteps.set(`msg-${msg.id}`, steps);
							}
							// Hydrate write_todos plan state from persisted tool calls
							const writeTodosCalls = extractWriteTodosFromContent(msg.content);
							for (const todoData of writeTodosCalls) {
								hydratePlanState(todoData);
							}
						}
						if (msg.role === "user") {
							const docs = extractMentionedDocuments(msg.content);
							if (docs.length > 0) {
								restoredDocsMap[`msg-${msg.id}`] = docs;
							}
						}
					}
					if (restoredThinkingSteps.size > 0) {
						setMessageThinkingSteps(restoredThinkingSteps);
					}
					if (Object.keys(restoredDocsMap).length > 0) {
						setMessageDocumentsMap(restoredDocsMap);
					}
				}
			}
			// For new chats (urlChatId === 0), don't create thread yet
			// Thread will be created lazily when user sends first message
			// This improves UX (instant load) and avoids orphan threads
		} catch (error) {
			console.error("[useThreadInitializer] Failed to initialize thread:", error);
			// Keep threadId as null - don't use Date.now() as it creates an invalid ID
			// that will cause 404 errors on subsequent API calls
			setThreadId(null);
			toast.error("Failed to load chat. Please try again.");
		} finally {
			setIsInitializing(false);
		}
	}, [
		urlChatId,
		setMessageDocumentsMap,
		setMentionedDocumentIds,
		setMentionedDocuments,
		hydratePlanState,
	]);

	// Initialize on mount
	useEffect(() => {
		initializeThread();
	}, [initializeThread]);

	return {
		isInitializing,
		threadId,
		setThreadId,
		messages,
		setMessages,
		messageThinkingSteps,
		setMessageThinkingSteps,
		initializeThread,
	};
}
