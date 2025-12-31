import {
	ActionBarPrimitive,
	AssistantIf,
	BranchPickerPrimitive,
	ComposerPrimitive,
	ErrorPrimitive,
	MessagePrimitive,
	ThreadPrimitive,
	useAssistantState,
	useComposerRuntime,
	useThreadViewport,
} from "@assistant-ui/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
	AlertCircle,
	ArrowDownIcon,
	ArrowUpIcon,
	
	
	
	
	
	FileText,
	Loader2,
	PencilIcon,
	
	
	
	SquareIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
	createContext,
	type FC,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import {
	mentionedDocumentIdsAtom,
	mentionedDocumentsAtom,
	messageDocumentsMapAtom,
} from "@/atoms/chat/mentioned-documents.atom";
import {
	globalNewLLMConfigsAtom,
	llmPreferencesAtom,
	newLLMConfigsAtom,
} from "@/atoms/new-llm-config/new-llm-config-query.atoms";
import { currentUserAtom } from "@/atoms/user/user-query.atoms";
import {
	ComposerAddAttachment,
	ComposerAttachments,
	UserMessageAttachments,
} from "@/components/assistant-ui/attachment";
import { ConnectorIndicator } from "@/components/assistant-ui/connector-indicator";
import { Composer } from "@/components/assistant-ui/composer";
import { ComposerAction } from "@/components/assistant-ui/composer-action";
import {
	InlineMentionEditor,
	type InlineMentionEditorRef,
} from "@/components/assistant-ui/inline-mention-editor";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import {
	AssistantActionBar,
	UserActionBar,
} from "@/components/assistant-ui/message-actions";
import { ThinkingStepsDisplay } from "@/components/assistant-ui/thinking-steps-ui";
import { ThreadWelcome } from "@/components/assistant-ui/thread-welcome";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import {
	DocumentMentionPicker,
	type DocumentMentionPickerRef,
} from "@/components/new-chat/document-mention-picker";
import type { ThinkingStep } from "@/components/tool-ui/deepagent-thinking";
import { Button } from "@/components/ui/button";
import type { Document } from "@/contracts/types/document.types";
import { cn } from "@/lib/utils";

/**
 * Props for the Thread component
 */
interface ThreadProps {
	messageThinkingSteps?: Map<string, ThinkingStep[]>;
	/** Optional header component to render at the top of the viewport (sticky) */
	header?: React.ReactNode;
}

// Context to pass thinking steps to AssistantMessage
const ThinkingStepsContext = createContext<Map<string, ThinkingStep[]>>(new Map());

/**
 * Chain of thought display component - single collapsible dropdown design
 */
const _ThinkingStepsScrollHandler: FC = () => {
	const thinkingStepsMap = useContext(ThinkingStepsContext);
	const viewport = useThreadViewport();
	const isRunning = useAssistantState(({ thread }) => thread.isRunning);
	// Track the serialized state to detect any changes
	const prevStateRef = useRef<string>("");

	useEffect(() => {
		// Only act during streaming
		if (!isRunning) {
			prevStateRef.current = "";
			return;
		}

		// Serialize the thinking steps state to detect any changes
		// This catches new steps, status changes, and item additions
		let stateString = "";
		thinkingStepsMap.forEach((steps, msgId) => {
			steps.forEach((step) => {
				stateString += `${msgId}:${step.id}:${step.status}:${step.items?.length || 0};`;
			});
		});

		// If state changed at all during streaming, scroll
		if (stateString !== prevStateRef.current && stateString !== "") {
			prevStateRef.current = stateString;

			// Multiple attempts to ensure scroll happens after DOM updates
			const scrollAttempt = () => {
				try {
					viewport.scrollToBottom();
				} catch {
					// Ignore errors - viewport might not be ready
				}
			};

			// Delayed attempts to handle async DOM updates
			requestAnimationFrame(scrollAttempt);
			setTimeout(scrollAttempt, 100);
		}
	}, [thinkingStepsMap, viewport, isRunning]);

	return null; // This component doesn't render anything
};

export const Thread: FC<ThreadProps> = ({ messageThinkingSteps = new Map(), header }) => {
	return (
		<ThinkingStepsContext.Provider value={messageThinkingSteps}>
			<ThreadPrimitive.Root
				className="aui-root aui-thread-root @container flex h-full min-h-0 flex-col bg-background"
				style={{
					["--thread-max-width" as string]: "44rem",
				}}
			>
				<ThreadPrimitive.Viewport
					turnAnchor="top"
					className="aui-thread-viewport relative flex flex-1 min-h-0 flex-col overflow-y-auto px-4 pt-4"
				>
					{/* Optional sticky header for model selector etc. */}
					{header && <div className="sticky top-0 z-10 mb-4">{header}</div>}

					<AssistantIf condition={({ thread }) => thread.isEmpty}>
						<ThreadWelcome />
					</AssistantIf>

					<ThreadPrimitive.Messages
						components={{
							UserMessage,
							EditComposer,
							AssistantMessage,
						}}
					/>

					<ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto mt-auto flex w-full max-w-(--thread-max-width) flex-col gap-4 overflow-visible rounded-t-3xl bg-background pb-4 md:pb-6">
						<ThreadScrollToBottom />
						<AssistantIf condition={({ thread }) => !thread.isEmpty}>
							<div className="fade-in slide-in-from-bottom-4 animate-in duration-500 ease-out fill-mode-both">
								<Composer />
							</div>
						</AssistantIf>
					</ThreadPrimitive.ViewportFooter>
				</ThreadPrimitive.Viewport>
			</ThreadPrimitive.Root>
		</ThinkingStepsContext.Provider>
	);
};

const ThreadScrollToBottom: FC = () => {
	return (
		<ThreadPrimitive.ScrollToBottom asChild>
			<TooltipIconButton
				tooltip="Scroll to bottom"
				variant="outline"
				className="aui-thread-scroll-to-bottom -top-12 absolute z-10 self-center rounded-full p-4 disabled:invisible dark:bg-background dark:hover:bg-accent"
			>
				<ArrowDownIcon />
			</TooltipIconButton>
		</ThreadPrimitive.ScrollToBottom>
	);
};



const MessageError: FC = () => {
	return (
		<MessagePrimitive.Error>
			<ErrorPrimitive.Root className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm dark:bg-destructive/5 dark:text-red-200">
				<ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
			</ErrorPrimitive.Root>
		</MessagePrimitive.Error>
	);
};

/**
 * Custom component to render thinking steps from Context
 */
const ThinkingStepsPart: FC = () => {
	const thinkingStepsMap = useContext(ThinkingStepsContext);

	// Get the current message ID to look up thinking steps
	const messageId = useAssistantState(({ message }) => message?.id);
	const thinkingSteps = thinkingStepsMap.get(messageId) || [];

	// Check if this specific message is currently streaming
	// A message is streaming if: thread is running AND this is the last assistant message
	const isThreadRunning = useAssistantState(({ thread }) => thread.isRunning);
	const isLastMessage = useAssistantState(({ message }) => message?.isLast ?? false);
	const isMessageStreaming = isThreadRunning && isLastMessage;

	if (thinkingSteps.length === 0) return null;

	return (
		<div className="mb-3">
			<ThinkingStepsDisplay steps={thinkingSteps} isThreadRunning={isMessageStreaming} />
		</div>
	);
};

const AssistantMessageInner: FC = () => {
	return (
		<>
			{/* Render thinking steps from message content - this ensures proper scroll tracking */}
			<ThinkingStepsPart />

			<div className="aui-assistant-message-content wrap-break-word px-2 text-foreground leading-relaxed">
				<MessagePrimitive.Parts
					components={{
						Text: MarkdownText,
						tools: { Fallback: ToolFallback },
					}}
				/>
				<MessageError />
			</div>

			<div className="aui-assistant-message-footer mt-1 mb-5 ml-2 flex">
				<BranchPicker />
				<AssistantActionBar />
			</div>
		</>
	);
};

const AssistantMessage: FC = () => {
	return (
		<MessagePrimitive.Root
			className="aui-assistant-message-root fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-(--thread-max-width) animate-in py-3 duration-150"
			data-role="assistant"
		>
			<AssistantMessageInner />
		</MessagePrimitive.Root>
	);
};

const UserMessage: FC = () => {
	const messageId = useAssistantState(({ message }) => message?.id);
	const messageDocumentsMap = useAtomValue(messageDocumentsMapAtom);
	const mentionedDocs = messageId ? messageDocumentsMap[messageId] : undefined;
	const hasAttachments = useAssistantState(
		({ message }) => message?.attachments && message.attachments.length > 0
	);

	return (
		<MessagePrimitive.Root
			className="aui-user-message-root fade-in slide-in-from-bottom-1 mx-auto grid w-full max-w-(--thread-max-width) animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 py-3 duration-150 [&:where(>*)]:col-start-2"
			data-role="user"
		>
			<div className="aui-user-message-content-wrapper col-start-2 min-w-0">
				{/* Display attachments and mentioned documents */}
				{(hasAttachments || (mentionedDocs && mentionedDocs.length > 0)) && (
					<div className="flex flex-wrap items-end gap-2 mb-2 justify-end">
						{/* Attachments (images show as thumbnails, documents as chips) */}
						<UserMessageAttachments />
						{/* Mentioned documents as chips */}
						{mentionedDocs?.map((doc) => (
							<span
								key={doc.id}
								className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs font-medium text-primary border border-primary/20"
								title={doc.title}
							>
								<FileText className="size-3" />
								<span className="max-w-[150px] truncate">{doc.title}</span>
							</span>
						))}
					</div>
				)}
				{/* Message bubble with action bar positioned relative to it */}
				<div className="relative">
					<div className="aui-user-message-content wrap-break-word rounded-2xl bg-muted px-4 py-2.5 text-foreground">
						<MessagePrimitive.Parts />
					</div>
					<div className="aui-user-action-bar-wrapper absolute top-1/2 right-full -translate-y-1/2 pr-1">
						<UserActionBar />
					</div>
				</div>
			</div>

			<BranchPicker className="aui-user-branch-picker -mr-1 col-span-full col-start-1 row-start-3 justify-end" />
		</MessagePrimitive.Root>
	);
};

const EditComposer: FC = () => {
	return (
		<MessagePrimitive.Root className="aui-edit-composer-wrapper mx-auto flex w-full max-w-(--thread-max-width) flex-col px-2 py-3">
			<ComposerPrimitive.Root className="aui-edit-composer-root ml-auto flex w-full max-w-[85%] flex-col rounded-2xl bg-muted">
				<ComposerPrimitive.Input
					className="aui-edit-composer-input min-h-14 w-full resize-none bg-transparent p-4 text-foreground text-sm outline-none"
					autoFocus
				/>
				<div className="aui-edit-composer-footer mx-3 mb-3 flex items-center gap-2 self-end">
					<ComposerPrimitive.Cancel asChild>
						<Button variant="ghost" size="sm">
							Cancel
						</Button>
					</ComposerPrimitive.Cancel>
					<ComposerPrimitive.Send asChild>
						<Button size="sm">Update</Button>
					</ComposerPrimitive.Send>
				</div>
			</ComposerPrimitive.Root>
		</MessagePrimitive.Root>
	);
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({ className, ...rest }) => {
	return (
		<BranchPickerPrimitive.Root
			hideWhenSingleBranch
			className={cn(
				"aui-branch-picker-root -ml-2 mr-2 inline-flex items-center text-muted-foreground text-xs",
				className
			)}
			{...rest}
		>
			<BranchPickerPrimitive.Previous asChild>
				<TooltipIconButton tooltip="Previous">
					<ChevronLeftIcon />
				</TooltipIconButton>
			</BranchPickerPrimitive.Previous>
			<span className="aui-branch-picker-state font-medium">
				<BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
			</span>
			<BranchPickerPrimitive.Next asChild>
				<TooltipIconButton tooltip="Next">
					<ChevronRightIcon />
				</TooltipIconButton>
			</BranchPickerPrimitive.Next>
		</BranchPickerPrimitive.Root>
	);
};
