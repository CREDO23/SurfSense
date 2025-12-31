"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import type { FC } from "react";
import { cn } from "@/lib/utils";
import { STEP_STATUS, THINKING_STATUS } from "@/lib/deepagent/constants";
import type {
	DeepAgentThinkingArgs,
	DeepAgentThinkingResult,
	StepStatus,
	ThinkingStatus,
	ThinkingStep,
} from "@/lib/deepagent/types";
import { ThinkingLoadingState } from "@/components/tool-ui/deepagent/thinking-loading-state";
import { SmartChainOfThought } from "@/components/tool-ui/deepagent/smart-chain-of-thought";

// ============================================================================
// Tool UI Component
// ============================================================================

/**
 * DeepAgent Thinking Tool UI Component
 *
 * This component displays the agent's chain-of-thought reasoning
 * in a collapsible, hierarchical format.
 */
export const DeepAgentThinkingToolUI = makeAssistantToolUI<
	DeepAgentThinkingArgs,
	DeepAgentThinkingResult
>({
	toolName: "deepagent_thinking",
	render: function DeepAgentThinkingUI({ result, status }) {
		// Loading state - tool is still running
		if (status.type === "running" || status.type === "requires-action") {
			return <ThinkingLoadingState status={result?.status ?? undefined} />;
		}

		// Incomplete/cancelled state
		if (status.type === "incomplete") {
			if (status.reason === "cancelled") {
				return null; // Don't show anything if cancelled
			}
			if (status.reason === "error") {
				return null; // Don't show error for thinking - it's not critical
			}
		}

		// No result or no steps - don't render anything
		if (!result?.steps || result.steps.length === 0) {
			return null;
		}

		// Render the chain of thought
		return (
			<div className="my-3 w-full">
				<SmartChainOfThought steps={result.steps} />
			</div>
		);
	},
});

// ============================================================================
// Public Components
// ============================================================================

export interface InlineThinkingDisplayProps {
	/** The thinking steps to display */
	steps: ThinkingStep[];
	/** Whether content is currently streaming */
	isStreaming?: boolean;
	/** Additional CSS class names */
	className?: string;
}

/**
 * Inline Thinking Display Component
 *
 * A simpler version that can be used inline with the message content
 * for displaying reasoning without the full tool UI infrastructure.
 */
export const InlineThinkingDisplay: FC<InlineThinkingDisplayProps> = ({
	steps,
	isStreaming = false,
	className,
}) => {
	if (steps.length === 0 && !isStreaming) {
		return null;
	}

	return (
		<div className={cn("my-3 w-full", className)}>
			{isStreaming && steps.length === 0 ? (
				<ThinkingLoadingState />
			) : (
				<SmartChainOfThought steps={steps} />
			)}
		</div>
	);
};

// ============================================================================
// Exports
// ============================================================================

export type {
	ThinkingStep,
	DeepAgentThinkingArgs,
	DeepAgentThinkingResult,
	StepStatus,
	ThinkingStatus,
};

export { STEP_STATUS, THINKING_STATUS };
