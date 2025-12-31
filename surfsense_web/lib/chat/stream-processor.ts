/**
 * Stream processing utilities for chat runtime
 * Handles SSE parsing and message content building
 */

import type { ThinkingStep } from "@/components/tool-ui/deepagent-thinking";
import { TOOLS_WITH_UI, extractThinkingSteps } from "@/lib/chat/chat-utils";
import { isPodcastGenerating, setActivePodcastTaskId } from "@/lib/chat/podcast-state";

interface ThinkingStepData {
	id: string;
	title: string;
	status: "pending" | "in_progress" | "completed";
	items: string[];
}

type ContentPart =
	| { type: "text"; text: string }
	| {
			type: "tool-call";
			toolCallId: string;
			toolName: string;
			args: Record<string, unknown>;
			result?: unknown;
	  };

interface StreamState {
	contentParts: ContentPart[];
	currentTextPart: { type: "text"; text: string } | null;
	thinkingSteps: Map<string, ThinkingStep[]>;
}

export class ChatStreamProcessor {
	private state: StreamState;

	constructor() {
		this.state = {
			contentParts: [],
			currentTextPart: null,
			thinkingSteps: new Map(),
		};
	}

	getState(): StreamState {
		return this.state;
	}

	appendText(text: string): void {
		if (!this.state.currentTextPart) {
			this.state.currentTextPart = { type: "text", text };
			this.state.contentParts.push(this.state.currentTextPart);
		} else {
			this.state.currentTextPart.text += text;
		}
	}

	addToolCall(toolCallId: string, toolName: string, args: Record<string, unknown>): void {
		this.state.currentTextPart = null;
		this.state.contentParts.push({
			type: "tool-call",
			toolCallId,
			toolName,
			args,
		});
	}

	setToolCallResult(toolCallId: string, result: unknown): void {
		const toolCall = this.state.contentParts.find(
			(part) => part.type === "tool-call" && part.toolCallId === toolCallId
		) as Extract<ContentPart, { type: "tool-call" }> | undefined;

		if (toolCall) {
			toolCall.result = result;
		}
	}

	processThinkingStep(data: ThinkingStepData): void {
		const { id, title, status, items } = data;
		const existing = this.state.thinkingSteps.get(id) || [];

		const step: ThinkingStep = {
			id,
			title,
			status,
			items,
		};

		const stepIndex = existing.findIndex((s) => s.id === id);
		if (stepIndex >= 0) {
			existing[stepIndex] = step;
		} else {
			existing.push(step);
		}

		this.state.thinkingSteps.set(id, existing);
	}

	buildContentForPersistence(): string {
		const parts: string[] = [];

		for (const part of this.state.contentParts) {
			if (part.type === "text") {
				parts.push(part.text);
			} else if (part.type === "tool-call" && TOOLS_WITH_UI.has(part.toolName)) {
				parts.push(
					`\n\n[Tool: ${part.toolName}]\n${JSON.stringify(part.args, null, 2)}\n`
				);

				if (part.result !== undefined) {
					parts.push(`Result: ${JSON.stringify(part.result, null, 2)}\n`);
				}
			}
		}

		return parts.join("");
	}

	processPodcastDetection(toolName: string, args: Record<string, unknown>): void {
		if (toolName === "generate_podcast" && !isPodcastGenerating()) {
			const taskId = (args.task_id as string) || null;
			if (taskId) {
				setActivePodcastTaskId(taskId);
			}
		}
	}
}

export async function* parseSSEStream(
	readableStream: ReadableStream<Uint8Array>
): AsyncGenerator<unknown, void, unknown> {
	const reader = readableStream.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");

			// Keep last incomplete line in buffer
			buffer = lines.pop() || "";

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed || !trimmed.startsWith("data:")) continue;

				const jsonStr = trimmed.slice(5).trim();
				if (!jsonStr || jsonStr === "[DONE]") continue;

				try {
					const parsed = JSON.parse(jsonStr);
					yield parsed;
				} catch (e) {
					if (e instanceof SyntaxError) continue;
					throw e;
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}
