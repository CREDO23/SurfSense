import { Bot, FileText } from "lucide-react";

export const ROLE_DESCRIPTIONS = {
	agent: {
		icon: Bot,
		title: "Agent LLM",
		description: "Primary LLM for chat interactions and agent operations",
		color: "bg-blue-100 text-blue-800 border-blue-200",
		examples: "Chat responses, agent tasks, real-time interactions",
		characteristics: ["Fast responses", "Conversational", "Agent operations"],
	},
	document_summary: {
		icon: FileText,
		title: "Document Summary LLM",
		description: "Handles document summarization, long context analysis, and query reformulation",
		color: "bg-purple-100 text-purple-800 border-purple-200",
		examples: "Document analysis, podcasts, research synthesis",
		characteristics: ["Large context window", "Deep reasoning", "Summarization"],
	},
};

export type RoleKey = keyof typeof ROLE_DESCRIPTIONS;
