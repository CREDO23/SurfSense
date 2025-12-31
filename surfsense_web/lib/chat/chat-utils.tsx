import { z } from "zod";
import type { ThreadMessageLike } from "@assistant-ui/react";
import type { ThinkingStep } from "@/components/tool-ui/deepagent-thinking";

/**
 * Type for persisted attachment info
 */
export interface PersistedAttachment {
	id: string;
	name: string;
	type: string;
	contentType?: string;
	imageDataUrl?: string;
	extractedContent?: string;
}

/**
 * Type for mentioned document info
 */
export interface MentionedDocumentInfo {
	id: number;
	title: string;
	document_type: string;
}

/**
 * Extract thinking steps from message content
 */
export function extractThinkingSteps(content: unknown): ThinkingStep[] {
	if (!Array.isArray(content)) return [];

	const thinkingPart = content.find(
		(part: unknown) =>
			typeof part === "object" &&
			part !== null &&
			"type" in part &&
			(part as { type: string }).type === "thinking-steps"
	) as { type: "thinking-steps"; steps: ThinkingStep[] } | undefined;

	return thinkingPart?.steps || [];
}

/**
 * Zod schema for mentioned document info (for type-safe parsing)
 */
const MentionedDocumentInfoSchema = z.object({
	id: z.number(),
	title: z.string(),
	document_type: z.string(),
});

const MentionedDocumentsPartSchema = z.object({
	type: z.literal("mentioned-documents"),
	documents: z.array(MentionedDocumentInfoSchema),
});

/**
 * Extract mentioned documents from message content (type-safe with Zod)
 */
export function extractMentionedDocuments(content: unknown): MentionedDocumentInfo[] {
	if (!Array.isArray(content)) return [];

	for (const part of content) {
		const result = MentionedDocumentsPartSchema.safeParse(part);
		if (result.success) {
			return result.data.documents;
		}
	}

	return [];
}

/**
 * Zod schema for persisted attachment info
 */
const PersistedAttachmentSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: z.string(),
	contentType: z.string().optional(),
	imageDataUrl: z.string().optional(),
	extractedContent: z.string().optional(),
});

const AttachmentsPartSchema = z.object({
	type: z.literal("attachments"),
	items: z.array(PersistedAttachmentSchema),
});

/**
 * Extract persisted attachments from message content (type-safe with Zod)
 */
export function extractPersistedAttachments(content: unknown): PersistedAttachment[] {
	if (!Array.isArray(content)) return [];

	for (const part of content) {
		const result = AttachmentsPartSchema.safeParse(part);
		if (result.success) {
			return result.data.items;
		}
	}

	return [];
}

/**
 * Type for backend message record
 */
export interface MessageRecord {
	id: number;
	role: "user" | "assistant";
	content: unknown;
	created_at: string;
}

/**
 * Convert backend message to assistant-ui ThreadMessageLike format
 * Filters out 'thinking-steps' part as it's handled separately via messageThinkingSteps
 * Restores attachments for user messages from persisted data
 */
export function convertToThreadMessage(msg: MessageRecord): ThreadMessageLike {
	let content: ThreadMessageLike["content"];

	if (typeof msg.content === "string") {
		content = [{ type: "text", text: msg.content }];
	} else if (Array.isArray(msg.content)) {
		// Filter out custom metadata parts - they're handled separately
		const filteredContent = msg.content.filter((part: unknown) => {
			if (typeof part !== "object" || part === null || !("type" in part)) return true;
			const partType = (part as { type: string }).type;
			// Filter out thinking-steps, mentioned-documents, and attachments
			return (
				partType !== "thinking-steps" &&
				partType !== "mentioned-documents" &&
				partType !== "attachments"
			);
		});
		content =
			filteredContent.length > 0
				? (filteredContent as ThreadMessageLike["content"])
				: [{ type: "text", text: "" }];
	} else {
		content = [{ type: "text", text: String(msg.content) }];
	}

	// Restore attachments for user messages
	let attachments: ThreadMessageLike["attachments"];
	if (msg.role === "user") {
		const persistedAttachments = extractPersistedAttachments(msg.content);
		if (persistedAttachments.length > 0) {
			attachments = persistedAttachments.map((att) => ({
				id: att.id,
				name: att.name,
				type: att.type as "document" | "image" | "file",
				contentType: att.contentType || "application/octet-stream",
				status: { type: "complete" as const },
				content: [],
				// Custom fields for our ChatAttachment interface
				imageDataUrl: att.imageDataUrl,
				extractedContent: att.extractedContent,
			}));
		}
	}

	return {
		id: `msg-${msg.id}`,
		role: msg.role,
		content,
		createdAt: new Date(msg.created_at),
		attachments,
	};
}

/**
 * Tools that should render custom UI in the chat.
 */
export const TOOLS_WITH_UI = new Set([
	"generate_podcast",
	"link_preview",
	"display_image",
	"scrape_webpage",
	"write_todos",
]);
