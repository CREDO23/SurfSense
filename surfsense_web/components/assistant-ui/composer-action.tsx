import {
	AssistantIf,
	ComposerPrimitive,
	useAssistantState,
} from "@assistant-ui/react";
import { useAtomValue } from "jotai";
import { AlertCircle, ArrowUpIcon, Loader2, SquareIcon } from "lucide-react";
import { type FC, useMemo } from "react";
import {
	globalNewLLMConfigsAtom,
	llmPreferencesAtom,
	newLLMConfigsAtom,
} from "@/atoms/new-llm-config/new-llm-config-query.atoms";
import { ComposerAddAttachment } from "@/components/assistant-ui/attachment";
import { ConnectorIndicator } from "@/components/assistant-ui/connector-indicator";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * ComposerAction component - controls for sending messages
 * Displays send button with validation, attachment controls, and connector indicator
 */
export const ComposerAction: FC = () => {
	// Check if any attachments are still being processed (running AND progress < 100)
	// When progress is 100, processing is done but waiting for send()
	const hasProcessingAttachments = useAssistantState(({ composer }) =>
		composer.attachments?.some((att) => {
			const status = att.status;
			if (status?.type !== "running") return false;
			const progress = (status as { type: "running"; progress?: number }).progress;
			return progress === undefined || progress < 100;
		})
	);

	// Check if composer text is empty
	const isComposerEmpty = useAssistantState(({ composer }) => {
		const text = composer.text?.trim() || "";
		return text.length === 0;
	});

	// Check if a model is configured
	const { data: userConfigs } = useAtomValue(newLLMConfigsAtom);
	const { data: globalConfigs } = useAtomValue(globalNewLLMConfigsAtom);
	const { data: preferences } = useAtomValue(llmPreferencesAtom);

	const hasModelConfigured = useMemo(() => {
		if (!preferences) return false;
		const agentLlmId = preferences.agent_llm_id;
		if (agentLlmId === null || agentLlmId === undefined) return false;

		// Check if the configured model actually exists
		if (agentLlmId < 0) {
			return globalConfigs?.some((c) => c.id === agentLlmId) ?? false;
		}
		return userConfigs?.some((c) => c.id === agentLlmId) ?? false;
	}, [preferences, globalConfigs, userConfigs]);

	const isSendDisabled = hasProcessingAttachments || isComposerEmpty || !hasModelConfigured;

	return (
		<div className="aui-composer-action-wrapper relative mx-2 mb-2 flex items-center justify-between">
			<div className="flex items-center gap-1">
				<ComposerAddAttachment />
				<ConnectorIndicator />
			</div>

			{/* Show processing indicator when attachments are being processed */}
			{hasProcessingAttachments && (
				<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
					<Loader2 className="size-3 animate-spin" />
					<span>Processing...</span>
				</div>
			)}

			{/* Show warning when no model is configured */}
			{!hasModelConfigured && !hasProcessingAttachments && (
				<div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs">
					<AlertCircle className="size-3" />
					<span>Select a model</span>
				</div>
			)}

			<AssistantIf condition={({ thread }) => !thread.isRunning}>
				<ComposerPrimitive.Send asChild disabled={isSendDisabled}>
					<TooltipIconButton
						tooltip={
							!hasModelConfigured
								? "Please select a model from the header to start chatting"
								: hasProcessingAttachments
									? "Wait for attachments to process"
									: isComposerEmpty
										? "Enter a message to send"
										: "Send message"
						}
						side="bottom"
						type="submit"
						variant="default"
						size="icon"
						className={cn(
							"aui-composer-send size-8 rounded-full",
							isSendDisabled && "cursor-not-allowed opacity-50"
						)}
						aria-label="Send message"
						disabled={isSendDisabled}
					>
						<ArrowUpIcon className="aui-composer-send-icon size-4" />
					</TooltipIconButton>
				</ComposerPrimitive.Send>
			</AssistantIf>

			<AssistantIf condition={({ thread }) => thread.isRunning}>
				<ComposerPrimitive.Cancel asChild>
					<Button
						type="button"
						variant="default"
						size="icon"
						className="aui-composer-cancel size-8 rounded-full"
						aria-label="Stop generating"
					>
						<SquareIcon className="aui-composer-cancel-icon size-3 fill-current" />
					</Button>
				</ComposerPrimitive.Cancel>
			</AssistantIf>
		</div>
	);
};
