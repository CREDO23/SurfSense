"use client";

import type { AppendMessage, ThreadMessageLike } from "@assistant-ui/react";
import { useExternalStoreRuntime } from "@assistant-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
	type MentionedDocumentInfo,
	mentionedDocumentIdsAtom,
	mentionedDocumentsAtom,
	messageDocumentsMapAtom,
} from "@/atoms/chat/mentioned-documents.atom";
import {
	extractWriteTodosFromContent,
	hydratePlanStateAtom,
} from "@/atoms/chat/plan-state.atom";
import type { ThinkingStep } from "@/components/tool-ui/deepagent-thinking";
import { getBearerToken } from "@/lib/auth-utils";
import {
	createAttachmentAdapter,
	extractAttachmentContent,
} from "@/lib/chat/attachment-adapter";
import {
	isPodcastGenerating,
	looksLikePodcastRequest,
	setActivePodcastTaskId,
} from "@/lib/chat/podcast-state";
import {
	TOOLS_WITH_UI,
	convertToThreadMessage,
	extractMentionedDocuments,
	extractThinkingSteps,
	type MessageRecord,
} from "@/lib/chat/chat-utils";
import { appendMessage, createThread } from "@/lib/chat/thread-persistence";
import {
	trackChatCreated,
	trackChatError,
	trackChatMessageSent,
	trackChatResponseReceived,
} from "@/lib/posthog/events";

interface ThinkingStepData {
	id: string;
	title: string;
	status: "pending" | "in_progress" | "completed";
	items: string[];
}

type ContentPart =
	| { type: "text"; text: string }
	| {
			type: "tool-call";
			toolCallId: string;
			toolName: string;
			args: Record<string, unknown>;
			result?: unknown;
	  };

interface UseChatRuntimeParams {
	threadId: number | null;
	searchSpaceId: number;
	messages: ThreadMessageLike[];
	setMessages: React.Dispatch<React.SetStateAction<ThreadMessageLike[]>>;
	setMessageThinkingSteps: React.Dispatch<
		React.SetStateAction<Map<string, ThinkingStep[]>>
	>;
}

export function useChatRuntime({
	threadId,
	searchSpaceId,
	messages,
	setMessages,
	setMessageThinkingSteps,
}: UseChatRuntimeParams) {
	const queryClient = useQueryClient();
	const [isRunning, setIsRunning] = useState(false);
	const abortControllerRef = useRef<AbortController | null>(null);

	// Atom state
	const mentionedDocumentIds = useAtomValue(mentionedDocumentIdsAtom);
	const mentionedDocuments = useAtomValue(mentionedDocumentsAtom);
	const setMentionedDocumentIds = useSetAtom(mentionedDocumentIdsAtom);
	const setMentionedDocuments = useSetAtom(mentionedDocumentsAtom);
	const setMessageDocumentsMap = useSetAtom(messageDocumentsMapAtom);
	const hydratePlanState = useSetAtom(hydratePlanStateAtom);

	// Create attachment adapter
	const attachmentAdapter = useMemo(() => createAttachmentAdapter(), []);

	// Cancel ongoing request
	const cancelRun = useCallback(async () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
		setIsRunning(false);
	}, []);

	// Handle new message from user
	const onNew = useCallback(
		async (message: AppendMessage) => {
			// Abort previous request
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
				abortControllerRef.current = null;
			}

			// Extract user query text
			let userQuery = "";
			for (const part of message.content) {
				if (part.type === "text") {
					userQuery += part.text;
				}
			}

			// Extract attachments
			const messageAttachments: Array<Record<string, unknown>> = [];
			if (message.attachments && message.attachments.length > 0) {
				for (const att of message.attachments) {
					messageAttachments.push(att as unknown as Record<string, unknown>);
				}
			}

			if (!userQuery.trim() && messageAttachments.length === 0) return;

			// Check podcast status
			if (isPodcastGenerating() && looksLikePodcastRequest(userQuery)) {
				toast.warning("A podcast is already being generated.");
				return;
			}

			const token = getBearerToken();
			if (!token) {
				toast.error("Not authenticated. Please log in again.");
				return;
			}

			// Create thread lazily if needed
			let currentThreadId = threadId;
			let isNewThread = false;
			if (!currentThreadId) {
				try {
					const newThread = await createThread(searchSpaceId, "New Chat");
					currentThreadId = newThread.id;
					isNewThread = true;

					// Track new chat creation
					trackChatCreated(searchSpaceId, currentThreadId);

					// Update URL
					const newUrl = `/dashboard/${searchSpaceId}/new-chat/${currentThreadId}`;
					window.history.replaceState({}, "", newUrl);
				} catch (err) {
					console.error("Failed to create thread:", err);
					toast.error("Failed to create chat. Please try again.");
					return;
				}
			}

			// Track message sent
			trackChatMessageSent(searchSpaceId, currentThreadId);

			// Create user message
			const userMsgId = `msg-user-${Date.now()}`;
			const userMessage: ThreadMessageLike = {
				id: userMsgId,
				role: "user",
				content: message.content,
				createdAt: new Date(),
			};

			setMessages((prev) => [...prev, userMessage]);

			// Store mentioned documents for this message
			if (mentionedDocuments.length > 0) {
				const docsInfo: MentionedDocumentInfo[] = mentionedDocuments.map((doc) => ({
					document_id: doc.documentId,
					title: doc.title,
					type: doc.type,
				}));
				setMessageDocumentsMap((prev) => {
					const newMap = new Map(prev);
					newMap.set(userMsgId, docsInfo);
					return newMap;
				});
			}

			// Persist user message
			const persistContent: unknown[] = [...message.content];
			if (messageAttachments.length > 0) {
				persistContent.push({
					type: "attachments",
					data: messageAttachments,
				});
			}

			appendMessage(currentThreadId, {
				role: "user",
				content: persistContent,
			})
				.then(() => {
					if (isNewThread) {
						queryClient.invalidateQueries({
							queryKey: ["threads", String(searchSpaceId)],
						});
					}
				})
				.catch((err) => console.error("Failed to persist user message:", err));

			// Start streaming
			setIsRunning(true);
			const controller = new AbortController();
			abortControllerRef.current = controller;

			// Prepare assistant message
			const assistantMsgId = `msg-assistant-${Date.now()}`;
			const currentThinkingSteps = new Map<string, ThinkingStepData>();
			const contentParts: ContentPart[] = [];
			let currentTextPartIndex = -1;
			const toolCallIndices = new Map<string, number>();

			// Helper: Append text delta
			const appendText = (delta: string) => {
				if (
					currentTextPartIndex >= 0 &&
					contentParts[currentTextPartIndex]?.type === "text"
				) {
					(contentParts[currentTextPartIndex] as { type: "text"; text: string }).text +=
						delta;
				} else {
					contentParts.push({ type: "text", text: delta });
					currentTextPartIndex = contentParts.length - 1;
				}
			};

			// Helper: Add tool call
			const addToolCall = (
				toolCallId: string,
				toolName: string,
				args: Record<string, unknown>
			) => {
				if (TOOLS_WITH_UI.has(toolName)) {
					contentParts.push({ type: "tool-call", toolCallId, toolName, args });
					toolCallIndices.set(toolCallId, contentParts.length - 1);
					currentTextPartIndex = -1;
				}
			};

			// Helper: Update tool call
			const updateToolCall = (
				toolCallId: string,
				update: { args?: Record<string, unknown>; result?: unknown }
			) => {
				const index = toolCallIndices.get(toolCallId);
				if (index !== undefined && contentParts[index]?.type === "tool-call") {
					const tc = contentParts[index] as ContentPart & { type: "tool-call" };
					if (update.args) tc.args = update.args;
					if (update.result !== undefined) tc.result = update.result;
				}
			};

			// Helper: Build content for UI
			const buildContentForUI = (): ThreadMessageLike["content"] => {
				const filtered = contentParts.filter((part) => {
					if (part.type === "text") return part.text.length > 0;
					if (part.type === "tool-call") return TOOLS_WITH_UI.has(part.toolName);
					return false;
				});
				return filtered.length > 0
					? (filtered as ThreadMessageLike["content"])
					: [{ type: "text", text: "" }];
			};

			// Helper: Build content for persistence
			const buildContentForPersistence = (): unknown[] => {
				const parts: unknown[] = [];

				if (currentThinkingSteps.size > 0) {
					parts.push({
						type: "thinking-steps",
						steps: Array.from(currentThinkingSteps.values()),
					});
				}

				for (const part of contentParts) {
					if (part.type === "text" && part.text.length > 0) {
						parts.push({ type: "text", text: part.text });
					} else if (part.type === "tool-call" && TOOLS_WITH_UI.has(part.toolName)) {
						parts.push(part);
					}
				}

				return parts.length > 0 ? parts : [{ type: "text", text: "" }];
			};

			// Add placeholder assistant message
			setMessages((prev) => [
				...prev,
				{
					id: assistantMsgId,
					role: "assistant",
					content: [{ type: "text", text: "" }],
					createdAt: new Date(),
				},
			]);

			try {
				const backendUrl =
					process.env.NEXT_PUBLIC_FASTAPI_BACKEND_URL || "http://localhost:8000";

				// Build message history
				const messageHistory = messages
					.filter((m) => m.role === "user" || m.role === "assistant")
					.map((m) => {
						let text = "";
						for (const part of m.content) {
							if (typeof part === "object" && part.type === "text" && "text" in part) {
								text += part.text;
							}
						}
						return { role: m.role, content: text };
					})
					.filter((m) => m.content.length > 0);

				// Extract attachments
				const attachments = extractAttachmentContent(messageAttachments);

				// Get mentioned document IDs
				const documentIds =
					mentionedDocumentIds.length > 0 ? [...mentionedDocumentIds] : undefined;

				// Clear mentioned documents
				if (mentionedDocumentIds.length > 0) {
					setMentionedDocumentIds([]);
					setMentionedDocuments([]);
				}

				const response = await fetch(`${backendUrl}/api/v1/new_chat`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						chat_id: currentThreadId,
						user_query: userQuery.trim(),
						search_space_id: searchSpaceId,
						messages: messageHistory,
						attachments: attachments.length > 0 ? attachments : undefined,
						mentioned_document_ids: documentIds,
					}),
					signal: controller.signal,
				});

				if (!response.ok) {
					throw new Error(`Backend error: ${response.status}`);
				}

				if (!response.body) {
					throw new Error("No response body");
				}

				// Parse SSE stream
				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";

				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;

						buffer += decoder.decode(value, { stream: true });
						const events = buffer.split(/\r?\n\r?\n/);
						buffer = events.pop() || "";

						for (const event of events) {
							const lines = event.split(/\r?\n/);
							for (const line of lines) {
								if (!line.startsWith("data: ")) continue;
								const data = line.slice(6).trim();
								if (!data || data === "[DONE]") continue;

								try {
									const parsed = JSON.parse(data);

									switch (parsed.type) {
										case "text-delta":
											appendText(parsed.delta);
											setMessages((prev) =>
												prev.map((m) =>
													m.id === assistantMsgId
														? { ...m, content: buildContentForUI() }
														: m
												)
											);
											break;

										case "tool-input-start":
											addToolCall(parsed.toolCallId, parsed.toolName, {});
											setMessages((prev) =>
												prev.map((m) =>
													m.id === assistantMsgId
														? { ...m, content: buildContentForUI() }
														: m
												)
											);
											break;

										case "tool-input-available": {
											if (toolCallIndices.has(parsed.toolCallId)) {
												updateToolCall(parsed.toolCallId, { args: parsed.input || {} });
											} else {
												addToolCall(parsed.toolCallId, parsed.toolName, parsed.input || {});
											}
											setMessages((prev) =>
												prev.map((m) =>
													m.id === assistantMsgId
														? { ...m, content: buildContentForUI() }
														: m
												)
											);
											break;
										}

										case "tool-output-available": {
											updateToolCall(parsed.toolCallId, { result: parsed.output });
											if (parsed.output?.status === "processing" && parsed.output?.task_id) {
												const idx = toolCallIndices.get(parsed.toolCallId);
												if (idx !== undefined) {
													const part = contentParts[idx];
													if (
														part?.type === "tool-call" &&
														part.toolName === "generate_podcast"
													) {
														setActivePodcastTaskId(parsed.output.task_id);
													}
												}
											}
											setMessages((prev) =>
												prev.map((m) =>
													m.id === assistantMsgId
														? { ...m, content: buildContentForUI() }
														: m
												)
											);
											break;
										}

										case "data-thinking-step": {
											const stepData = parsed.data as ThinkingStepData;
											if (stepData?.id) {
												currentThinkingSteps.set(stepData.id, stepData);
												setMessageThinkingSteps((prev) => {
													const newMap = new Map(prev);
													newMap.set(
														assistantMsgId,
														Array.from(currentThinkingSteps.values())
													);
													return newMap;
												});
											}
											break;
										}

										case "error":
											throw new Error(parsed.errorText || "Server error");
									}
								} catch (e) {
									if (e instanceof SyntaxError) continue;
									throw e;
								}
							}
						}
					}
				} finally {
					reader.releaseLock();
				}

				// Persist assistant message
				const finalContent = buildContentForPersistence();
				if (contentParts.length > 0) {
					appendMessage(currentThreadId, {
						role: "assistant",
						content: finalContent,
					}).catch((err) =>
						console.error("Failed to persist assistant message:", err)
					);

					trackChatResponseReceived(searchSpaceId, currentThreadId);
				}
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") {
					// Request cancelled - persist partial response
					const hasContent = contentParts.some(
						(part) =>
							(part.type === "text" && part.text.length > 0) ||
							(part.type === "tool-call" && TOOLS_WITH_UI.has(part.toolName))
					);
					if (hasContent && currentThreadId) {
						const partialContent = buildContentForPersistence();
						appendMessage(currentThreadId, {
							role: "assistant",
							content: partialContent,
						}).catch((err) =>
							console.error("Failed to persist partial assistant message:", err)
						);
					}
					return;
				}
				console.error("[useChatRuntime] Chat error:", error);

				trackChatError(
					searchSpaceId,
					currentThreadId,
					error instanceof Error ? error.message : "Unknown error"
				);

				toast.error("Failed to get response. Please try again.");
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
			} finally {
				setIsRunning(false);
				abortControllerRef.current = null;
			}
		},
		[
			threadId,
			searchSpaceId,
			messages,
			mentionedDocumentIds,
			mentionedDocuments,
			setMentionedDocumentIds,
			setMentionedDocuments,
			setMessageDocumentsMap,
			queryClient,
			setMessages,
			setMessageThinkingSteps,
			hydratePlanState,
		]
	);

	// Convert message (pass through)
	const convertMessage = useCallback(
		(message: ThreadMessageLike): ThreadMessageLike => message,
		[]
	);

	// Handle editing a message
	const onEdit = useCallback(
		async (message: AppendMessage) => {
			await onNew(message);
		},
		[onNew]
	);

	// Create runtime
	const runtime = useExternalStoreRuntime({
		messages,
		isRunning,
		onNew,
		onEdit,
		convertMessage,
		onCancel: cancelRun,
		adapters: {
			attachments: attachmentAdapter,
		},
	});

	return runtime;
}
