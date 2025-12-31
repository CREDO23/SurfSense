"use client";

/**
 * Loading state component for chat page
 */
export function ChatLoadingState() {
	return (
		<div className="flex h-[calc(100vh-64px)] items-center justify-center">
			<div className="text-muted-foreground">Loading chat...</div>
		</div>
	);
}
