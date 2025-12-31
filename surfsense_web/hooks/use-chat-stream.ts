/**
 * Chat streaming hook - handles the SSE streaming logic
 * Extracted from use-chat-runtime.ts
 */

import type { AppendMessage } from "@assistant-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { ThinkingStep } from "@/components/tool-ui/deepagent-thinking";
import { getBearerToken } from "@/lib/auth-utils";
import { extractAttachmentContent } from "@/lib/chat/attachment-adapter";
import { looksLikePodcastRequest } from "@/lib/chat/podcast-state";
import { ChatStreamProcessor, parseSSEStream } from "@/lib/chat/stream-processor";
import { appendMessage, createThread } from "@/lib/chat/thread-persistence";
import { extractMentionedDocuments } from "@/lib/chat/chat-utils";
import {
	trackChatCreated,
	trackChatError,
	trackChatMessageSent,
	trackChatResponseReceived,
} from "@/lib/posthog/events";
import type { useChatMessageHandler } from "./use-chat-message-handler";

interface UseChatStreamParams {
	threadId: number | null;
	searchSpaceId: number;
	mentionedDocumentIds: number[];
	mentionedDocuments: Map<number, unknown>;
	messageHandler: ReturnType<typeof useChatMessageHandler>;
}

export function useChatStream({
	threadId,
	searchSpaceId,
	mentionedDocumentIds,
	mentionedDocuments,
	messageHandler,
}: UseChatStreamParams) {
	const queryClient = useQueryClient();
	const [isRunning, setIsRunning] = useState(false);
	const abortControllerRef = useRef<AbortController | null>(null);

	const cancelRun = useCallback(async () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
		setIsRunning(false);
	}, []);

	const streamMessage = useCallback(
		async (message: AppendMessage) => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
				abortControllerRef.current = null;
			}

			let userQuery = "";
			for (const part of message.content) {
				if (part.type === "text") {
					userQuery += part.text;
				}
			}

			const messageAttachments: Array<Record<string, unknown>> = [];
			if (message.attachments && message.attachments.length > 0) {
				for (const att of message.attachments) {
					messageAttachments.push(att as unknown as Record<string, unknown>);
				}
			}

			const attachmentContent = extractAttachmentContent(messageAttachments);
			const finalUserContent = attachmentContent
				? `${userQuery}\n\nAttachments:\n${attachmentContent}`
				: userQuery;

			const userMsgId = `user-${Date.now()}`;
			const assistantMsgId = `assistant-${Date.now()}`;

			const currentMentionedDocumentIds = [...mentionedDocumentIds];
			const currentMentionedDocuments = new Map(mentionedDocuments);

			messageHandler.addUserMessage(userMsgId, finalUserContent, currentMentionedDocumentIds);
			messageHandler.addAssistantMessage(assistantMsgId);

			let currentThreadId = threadId;

			try {
				setIsRunning(true);
				abortControllerRef.current = new AbortController();

				if (!currentThreadId) {
					const shortContent =
						finalUserContent.length > 100
							? `${finalUserContent.slice(0, 100)}...`
							: finalUserContent;
					const newThread = await createThread(searchSpaceId, shortContent);
					currentThreadId = newThread.id;

					trackChatCreated(searchSpaceId, currentThreadId);
					queryClient.invalidateQueries({ queryKey: ["chat-threads", searchSpaceId] });
				}

				await appendMessage(currentThreadId, {
					role: "user",
					content: finalUserContent,
				});

				if (looksLikePodcastRequest(userQuery)) {
					trackChatMessageSent(searchSpaceId, currentThreadId, "podcast_request");
				} else {
					trackChatMessageSent(searchSpaceId, currentThreadId, "text");
				}

				const processor = new ChatStreamProcessor();
				const token = await getBearerToken();

				const response = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/api/new-chat/stream-chat`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: token || "",
						},
						body: JSON.stringify({
							chat_thread_id: currentThreadId,
							search_space_id: searchSpaceId,
							query: finalUserContent,
							document_ids: currentMentionedDocumentIds,
						}),
						signal: abortControllerRef.current.signal,
					}
				);

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				if (!response.body) {
					throw new Error("No response body");
				}

				for await (const parsed of parseSSEStream(response.body)) {
					const event = parsed as {
						type: string;
						text?: string;
						toolCallId?: string;
						toolName?: string;
						args?: Record<string, unknown>;
						result?: unknown;
						errorText?: string;
						data?: unknown;
					};

					switch (event.type) {
						case "text-delta":
							if (event.text) {
								processor.appendText(event.text);
								const state = processor.getState();
								messageHandler.updateAssistantMessage(
									assistantMsgId,
									state.contentParts as Array<{ type: string; text?: string }>
								);
							}
							break;

						case "tool-call":
							if (event.toolCallId && event.toolName && event.args) {
								processor.addToolCall(event.toolCallId, event.toolName, event.args);
								processor.processPodcastDetection(event.toolName, event.args);
								const state = processor.getState();
								messageHandler.updateAssistantMessage(
									assistantMsgId,
									state.contentParts as Array<{ type: string; text?: string }>
								);
							}
							break;

						case "tool-result":
							if (event.toolCallId) {
								processor.setToolCallResult(event.toolCallId, event.result);
							}
							break;

						case "thinking-step":
							if (event.data) {
								const stepData = event.data as {
									id: string;
									title: string;
									status: "pending" | "in_progress" | "completed";
									items: string[];
								};
								processor.processThinkingStep(stepData);
								const state = processor.getState();
								const steps = state.thinkingSteps.get(stepData.id);
								if (steps) {
									messageHandler.updateThinkingSteps(assistantMsgId, steps);
								}
							}
							break;

						case "finish":
							const finalContent = processor.buildContentForPersistence();
							const mentions = extractMentionedDocuments(finalContent);
							const mentionDocIds = mentions.map((m) => m.id);

							messageHandler.processDocumentMentions(
								assistantMsgId,
								mentions,
								mentionDocIds
							);

							messageHandler.processPlanState(finalContent);

							if (processor.getState().contentParts.length > 0) {
								appendMessage(currentThreadId!, {
									role: "assistant",
									content: finalContent,
								}).catch((err) =>
									console.error("Failed to persist assistant message:", err)
								);

								trackChatResponseReceived(searchSpaceId, currentThreadId!);
							}
							break;

						case "error":
							throw new Error(event.errorText || "Server error");
					}
				}
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") {
					const state = processor.getState();
					const hasContent = state.contentParts.some(
						(part) => (part.type === "text" && part.text.length > 0) || part.type === "tool-call"
					);
					if (hasContent && currentThreadId) {
						const partialContent = processor.buildContentForPersistence();
						appendMessage(currentThreadId, {
							role: "assistant",
							content: partialContent,
						}).catch((err) =>
							console.error("Failed to persist partial assistant message:", err)
						);
					}
					return;
				}

				console.error("[useChatStream] Chat error:", error);
				trackChatError(
					searchSpaceId,
					currentThreadId,
					error instanceof Error ? error.message : "Unknown error"
				);

				toast.error("Failed to get response. Please try again.");
				messageHandler.setErrorMessage(assistantMsgId);
			} finally {
				setIsRunning(false);
				abortControllerRef.current = null;
			}
		},
		[
			threadId,
			searchSpaceId,
			mentionedDocumentIds,
			mentionedDocuments,
			messageHandler,
			queryClient,
		]
	);

	return { isRunning, streamMessage, cancelRun };
}
