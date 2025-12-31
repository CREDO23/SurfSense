import { Brain, CheckCircle2, Loader2, Search, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STEP_STATUS, STEP_KEYWORDS, ICON_SIZE_CLASS } from "./constants";
import type { StepStatus } from "./types";

/**
 * Icon utilities for thinking steps
 */

/**
 * Check if title contains any of the keywords
 */
function titleContainsKeywords(title: string, keywords: readonly string[]): boolean {
	const titleLower = title.toLowerCase();
	return keywords.some((keyword) => titleLower.includes(keyword));
}

/**
 * Get icon based on step status and title
 */
export function getStepIcon(status: StepStatus, title: string): ReactNode {
	if (status === STEP_STATUS.IN_PROGRESS) {
		return <Loader2 className={cn(ICON_SIZE_CLASS, "animate-spin text-primary")} />;
	}

	if (status === STEP_STATUS.COMPLETED) {
		return <CheckCircle2 className={cn(ICON_SIZE_CLASS, "text-emerald-500")} />;
	}

	// Default icons based on step type keywords
	if (titleContainsKeywords(title, STEP_KEYWORDS.SEARCH)) {
		return <Search className={cn(ICON_SIZE_CLASS, "text-muted-foreground")} />;
	}

	if (titleContainsKeywords(title, STEP_KEYWORDS.ANALYSIS)) {
		return <Brain className={cn(ICON_SIZE_CLASS, "text-muted-foreground")} />;
	}

	return <Sparkles className={cn(ICON_SIZE_CLASS, "text-muted-foreground")} />;
}
