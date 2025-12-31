/**
 * Message handling hook for chat runtime
 * Manages message state updates and document mentions
 */

import type { ThreadMessageLike } from "@assistant-ui/react";
import { useSetAtom } from "jotai";
import { useCallback } from "react";
import type { MentionedDocumentInfo } from "@/atoms/chat/mentioned-documents.atom";
import {
	mentionedDocumentIdsAtom,
	mentionedDocumentsAtom,
	messageDocumentsMapAtom,
} from "@/atoms/chat/mentioned-documents.atom";
import { extractWriteTodosFromContent, hydratePlanStateAtom } from "@/atoms/chat/plan-state.atom";
import type { ThinkingStep } from "@/components/tool-ui/deepagent-thinking";

interface UseMessageHandlerParams {
	setMessages: React.Dispatch<React.SetStateAction<ThreadMessageLike[]>>;
	setMessageThinkingSteps: React.Dispatch<
		React.SetStateAction<Map<string, ThinkingStep[]>>
	>;
}

export function useChatMessageHandler({
	setMessages,
	setMessageThinkingSteps,
}: UseMessageHandlerParams) {
	const setMentionedDocumentIds = useSetAtom(mentionedDocumentIdsAtom);
	const setMentionedDocuments = useSetAtom(mentionedDocumentsAtom);
	const setMessageDocumentsMap = useSetAtom(messageDocumentsMapAtom);
	const hydratePlanState = useSetAtom(hydratePlanStateAtom);

	const addUserMessage = useCallback(
		(userMsgId: string, content: string, documentIds: number[]) => {
			const userMessage: ThreadMessageLike = {
				id: userMsgId,
				role: "user",
				content: [{ type: "text", text: content }],
				createdAt: new Date(),
			};
			setMessages((prev) => [...prev, userMessage]);

			if (documentIds.length > 0) {
				setMessageDocumentsMap((prev) => {
					const newMap = new Map(prev);
					newMap.set(userMsgId, documentIds);
					return newMap;
				});
			}
		},
		[setMessages, setMessageDocumentsMap]
	);

	const addAssistantMessage = useCallback(
		(assistantMsgId: string) => {
			const assistantMessage: ThreadMessageLike = {
				id: assistantMsgId,
				role: "assistant",
				content: [{ type: "text", text: "" }],
				createdAt: new Date(),
			};
			setMessages((prev) => [...prev, assistantMessage]);
		},
		[setMessages]
	);

	const updateAssistantMessage = useCallback(
		(assistantMsgId: string, contentParts: Array<{ type: string; text?: string }>) => {
			setMessages((prev) =>
				prev.map((m) =>
					m.id === assistantMsgId
						? {
								...m,
								content: contentParts as ThreadMessageLike["content"],
							}
						: m
				)
			);
		},
		[setMessages]
	);

	const setErrorMessage = useCallback(
		(assistantMsgId: string) => {
			setMessages((prev) =>
				prev.map((m) =>
					m.id === assistantMsgId
						? {
								...m,
								content: [
									{
										type: "text",
										text: "Sorry, there was an error. Please try again.",
									},
								],
							}
						: m
				)
			);
		},
		[setMessages]
	);

	const updateThinkingSteps = useCallback(
		(assistantMsgId: string, steps: ThinkingStep[]) => {
			setMessageThinkingSteps((prevMap) => {
				const newMap = new Map(prevMap);
				newMap.set(assistantMsgId, Array.from(steps));
				return newMap;
			});
		},
		[setMessageThinkingSteps]
	);

	const processDocumentMentions = useCallback(
		(
			assistantMsgId: string,
			mentions: MentionedDocumentInfo[],
			documentIds: number[]
		) => {
			if (mentions.length > 0) {
				setMentionedDocumentIds((prevIds) => [...new Set([...prevIds, ...documentIds])]);
				setMentionedDocuments((prevDocs) => {
					const newDocs = new Map(prevDocs);
					for (const doc of mentions) {
						newDocs.set(doc.id, doc);
					}
					return newDocs;
				});

				setMessageDocumentsMap((prev) => {
					const newMap = new Map(prev);
					newMap.set(assistantMsgId, documentIds);
					return newMap;
				});
			}
		},
		[setMentionedDocumentIds, setMentionedDocuments, setMessageDocumentsMap]
	);

	const processPlanState = useCallback(
		(content: string) => {
			const writeTodos = extractWriteTodosFromContent(content);
			if (writeTodos) {
				hydratePlanState(writeTodos);
			}
		},
		[hydratePlanState]
	);

	return {
		addUserMessage,
		addAssistantMessage,
		updateAssistantMessage,
		setErrorMessage,
		updateThinkingSteps,
		processDocumentMentions,
		processPlanState,
	};
}
