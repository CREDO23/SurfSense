import { STEP_STATUS } from "./constants";
import {
	ThinkingStep,
	ThinkingStepSchema,
	DeepAgentThinkingResult,
	DeepAgentThinkingResultSchema,
} from "./types";

/**
 * Parser functions for thinking data validation
 */

/** Default fallback step when parsing fails */
const DEFAULT_FALLBACK_STEP: ThinkingStep = {
	id: "unknown",
	title: "Processing...",
	items: [],
	status: STEP_STATUS.PENDING,
} as const;

/**
 * Parse and validate a single thinking step
 */
export function parseThinkingStep(data: unknown): ThinkingStep {
	const result = ThinkingStepSchema.safeParse(data);
	if (!result.success) {
		console.warn("Invalid thinking step data:", result.error.issues);
		return DEFAULT_FALLBACK_STEP;
	}
	return result.data;
}

/**
 * Parse and validate thinking result
 */
export function parseThinkingResult(data: unknown): DeepAgentThinkingResult {
	const result = DeepAgentThinkingResultSchema.safeParse(data);
	if (!result.success) {
		console.warn("Invalid thinking result data:", result.error.issues);
		return {};
	}
	return result.data;
}
