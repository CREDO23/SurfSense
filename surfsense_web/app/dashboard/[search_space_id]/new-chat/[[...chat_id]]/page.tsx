"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";
import { ChatHeader } from "@/components/new-chat/chat-header";
import { ChatLoadingState } from "@/components/new-chat/chat-loading-state";
import { ChatErrorState } from "@/components/new-chat/chat-error-state";
import { ChatToolProviders } from "@/components/new-chat/chat-tool-providers";
import { useChatParams } from "@/hooks/use-chat-params";
import { useChatRuntime } from "@/hooks/use-chat-runtime";
import { useThreadInitializer } from "@/hooks/use-thread-initializer";

export default function NewChatPage() {
	// Extract URL params
	const { searchSpaceId, urlChatId } = useChatParams();

	// Use thread initializer to load existing thread
	const {
		threadId,
		setThreadId,
		messages,
		setMessages,
		messageThinkingSteps,
		setMessageThinkingSteps,
		isInitializing,
		setIsInitializing,
		initializeThread,
	} = useThreadInitializer(urlChatId, searchSpaceId);

	// Create chat runtime with streaming
	const runtime = useChatRuntime({
		threadId,
		searchSpaceId,
		messages,
		setThreadId,
		setMessages,
		setMessageThinkingSteps,
	});

	// Show loading state when initializing
	if (isInitializing) {
		return <ChatLoadingState />;
	}

	// Show error state only if we tried to load an existing thread but failed
	// For new chats (urlChatId === 0), threadId being null is expected (lazy creation)
	if (!threadId && urlChatId > 0) {
		return (
			<ChatErrorState
				onRetry={() => {
					setIsInitializing(true);
					initializeThread();
				}}
			/>
		);
	}

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<ChatToolProviders>
				<div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
					<Thread
						messageThinkingSteps={messageThinkingSteps}
						header={<ChatHeader searchSpaceId={searchSpaceId} />}
					/>
				</div>
			</ChatToolProviders>
		</AssistantRuntimeProvider>
	);
}
