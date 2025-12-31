/**
 * Constants for DeepAgent thinking UI
 */

/** Step status values */
export const STEP_STATUS = {
	PENDING: "pending",
	IN_PROGRESS: "in_progress",
	COMPLETED: "completed",
} as const;

/** Agent thinking status values */
export const THINKING_STATUS = {
	THINKING: "thinking",
	SEARCHING: "searching",
	SYNTHESIZING: "synthesizing",
	COMPLETED: "completed",
} as const;

/** Keywords for icon detection */
export const STEP_KEYWORDS = {
	SEARCH: ["search", "knowledge"] as const,
	ANALYSIS: ["analy", "understand"] as const,
} as const;

/** Icon size class */
export const ICON_SIZE_CLASS = "size-4" as const;

/** Status text mapping */
export const STATUS_TEXT_MAP: Record<string, string> = {
	[THINKING_STATUS.SEARCHING]: "Searching knowledge base...",
	[THINKING_STATUS.SYNTHESIZING]: "Synthesizing response...",
	[THINKING_STATUS.THINKING]: "Thinking...",
} as const;
