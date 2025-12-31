"use client";

interface ChatErrorStateProps {
	onRetry: () => void;
}

/**
 * Error state component for chat page
 */
export function ChatErrorState({ onRetry }: ChatErrorStateProps) {
	return (
		<div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center gap-4">
			<div className="text-destructive">Failed to load chat</div>
			<button
				type="button"
				onClick={onRetry}
				className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
			>
				Try Again
			</button>
		</div>
	);
}
