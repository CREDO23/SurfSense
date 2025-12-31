import { z } from "zod";

/**
 * Zod schemas for podcast generation and validation
 */

export const GeneratePodcastArgsSchema = z.object({
	source_content: z.string(),
	podcast_title: z.string().nullish(),
	user_prompt: z.string().nullish(),
});

export const GeneratePodcastResultSchema = z.object({
	status: z.enum(["processing", "already_generating", "success", "error"]),
	task_id: z.string().nullish(),
	podcast_id: z.number().nullish(),
	title: z.string().nullish(),
	transcript_entries: z.number().nullish(),
	message: z.string().nullish(),
	error: z.string().nullish(),
});

export const TaskStatusResponseSchema = z.object({
	status: z.enum(["processing", "success", "error"]),
	podcast_id: z.number().nullish(),
	title: z.string().nullish(),
	transcript_entries: z.number().nullish(),
	state: z.string().nullish(),
	error: z.string().nullish(),
});

export const PodcastTranscriptEntrySchema = z.object({
	speaker_id: z.number(),
	dialog: z.string(),
});

export const PodcastDetailsSchema = z.object({
	podcast_transcript: z.array(PodcastTranscriptEntrySchema).nullish(),
});

/**
 * Types derived from Zod schemas
 */
export type GeneratePodcastArgs = z.infer<typeof GeneratePodcastArgsSchema>;
export type GeneratePodcastResult = z.infer<typeof GeneratePodcastResultSchema>;
export type TaskStatusResponse = z.infer<typeof TaskStatusResponseSchema>;
export type PodcastTranscriptEntry = z.infer<typeof PodcastTranscriptEntrySchema>;

/**
 * Parse and validate task status response
 */
export function parseTaskStatusResponse(data: unknown): TaskStatusResponse {
	const result = TaskStatusResponseSchema.safeParse(data);
	if (!result.success) {
		console.warn("Invalid task status response:", result.error.issues);
		return { status: "error", error: "Invalid response from server" };
	}
	return result.data;
}

/**
 * Parse and validate podcast details
 */
export function parsePodcastDetails(data: unknown): { podcast_transcript?: PodcastTranscriptEntry[] } {
	const result = PodcastDetailsSchema.safeParse(data);
	if (!result.success) {
		console.warn("Invalid podcast details:", result.error.issues);
		return {};
	}
	return {
		podcast_transcript: result.data.podcast_transcript ?? undefined,
	};
}
