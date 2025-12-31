"use client";

import type { AppendMessage, ThreadMessageLike } from "@assistant-ui/react";
import { useExternalStoreRuntime } from "@assistant-ui/react";
import { useAtomValue } from "jotai";
import { useCallback, useMemo } from "react";
import {
	mentionedDocumentIdsAtom,
	mentionedDocumentsAtom,
} from "@/atoms/chat/mentioned-documents.atom";
import { createAttachmentAdapter } from "@/lib/chat/attachment-adapter";
import type { ThinkingStep } from "@/components/tool-ui/deepagent-thinking";
import { useChatMessageHandler } from "./use-chat-message-handler";
import { useChatStream } from "./use-chat-stream";

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
	const mentionedDocumentIds = useAtomValue(mentionedDocumentIdsAtom);
	const mentionedDocuments = useAtomValue(mentionedDocumentsAtom);

	const messageHandler = useChatMessageHandler({
		setMessages,
		setMessageThinkingSteps,
	});

	const { isRunning, streamMessage, cancelRun } = useChatStream({
		threadId,
		searchSpaceId,
		mentionedDocumentIds,
		mentionedDocuments,
		messageHandler,
	});

	const attachmentAdapter = useMemo(() => createAttachmentAdapter(), []);

	const convertMessage = useCallback(
		(message: ThreadMessageLike): ThreadMessageLike => message,
		[]
	);

	const onEdit = useCallback(
		async (message: AppendMessage) => {
			await streamMessage(message);
		},
		[streamMessage]
	);

	const runtime = useExternalStoreRuntime({
		messages,
		isRunning,
		onNew: streamMessage,
		onEdit,
		convertMessage,
		onCancel: cancelRun,
		adapters: {
			attachments: attachmentAdapter,
		},
	});

	return runtime;
}
