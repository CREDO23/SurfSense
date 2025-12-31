"use client";

import { Brain } from "lucide-react";
import { useMemo, type FC } from "react";
import { THINKING_STATUS, STATUS_TEXT_MAP } from "@/lib/deepagent/constants";
import type { ThinkingStatus } from "@/lib/deepagent/types";

interface ThinkingLoadingStateProps {
	status?: ThinkingStatus;
}

/**
 * Loading state indicator for thinking process
 */
export const ThinkingLoadingState: FC<ThinkingLoadingStateProps> = ({ status }) => {
	const statusText = useMemo(() => {
		if (status && status in STATUS_TEXT_MAP) {
			return STATUS_TEXT_MAP[status];
		}
		return STATUS_TEXT_MAP[THINKING_STATUS.THINKING];
	}, [status]);

	return (
		<div className="my-3 flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
			<div className="relative">
				<Brain className="size-5 text-primary" />
				<span className="absolute -right-0.5 -top-0.5 flex size-2">
					<span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
					<span className="relative inline-flex size-2 rounded-full bg-primary" />
				</span>
			</div>
			<span className="text-sm text-muted-foreground">{statusText}</span>
		</div>
	);
};
