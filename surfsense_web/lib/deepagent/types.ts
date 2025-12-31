import { z } from "zod";
import { STEP_STATUS, THINKING_STATUS } from "./constants";

/**
 * Type definitions for DeepAgent thinking
 */

export type StepStatus = (typeof STEP_STATUS)[keyof typeof STEP_STATUS];
export type ThinkingStatus = (typeof THINKING_STATUS)[keyof typeof THINKING_STATUS];

export const ThinkingStepSchema = z.object({
	id: z.string(),
	title: z.string(),
	items: z.array(z.string()).default([]),
	status: z
		.enum([STEP_STATUS.PENDING, STEP_STATUS.IN_PROGRESS, STEP_STATUS.COMPLETED])
		.default(STEP_STATUS.PENDING),
});

export const DeepAgentThinkingArgsSchema = z.object({
	query: z.string().nullish(),
	context: z.string().nullish(),
});

export const DeepAgentThinkingResultSchema = z.object({
	steps: z.array(ThinkingStepSchema).nullish(),
	status: z
		.enum([
			THINKING_STATUS.THINKING,
			THINKING_STATUS.SEARCHING,
			THINKING_STATUS.SYNTHESIZING,
			THINKING_STATUS.COMPLETED,
		])
		.nullish(),
	summary: z.string().nullish(),
});

export type ThinkingStep = z.infer<typeof ThinkingStepSchema>;
export type DeepAgentThinkingArgs = z.infer<typeof DeepAgentThinkingArgsSchema>;
export type DeepAgentThinkingResult = z.infer<typeof DeepAgentThinkingResultSchema>;
