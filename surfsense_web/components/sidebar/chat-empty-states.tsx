import { MessageCircleMore, Search } from "lucide-react";

interface ChatEmptyStatesProps {
	isSearchMode: boolean;
	showArchived: boolean;
	// Translation labels
	noChatsFoundLabel?: string;
	tryDifferentSearchLabel?: string;
	noArchivedChatsLabel?: string;
	noChatsLabel?: string;
	startNewChatHintLabel?: string;
}

export function ChatEmptyStates({
	isSearchMode,
	showArchived,
	noChatsFoundLabel = "No chats found",
	tryDifferentSearchLabel = "Try a different search term",
	noArchivedChatsLabel = "No archived chats",
	noChatsLabel = "No chats yet",
	startNewChatHintLabel = "Start a new chat from the chat page",
}: ChatEmptyStatesProps) {
	if (isSearchMode) {
		return (
			<div className="text-center py-8">
				<Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
				<p className="text-sm text-muted-foreground">{noChatsFoundLabel}</p>
				<p className="text-xs text-muted-foreground/70 mt-1">{tryDifferentSearchLabel}</p>
			</div>
		);
	}

	return (
		<div className="text-center py-8">
			<MessageCircleMore className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
			<p className="text-sm text-muted-foreground">
				{showArchived ? noArchivedChatsLabel : noChatsLabel}
			</p>
			{!showArchived && (
				<p className="text-xs text-muted-foreground/70 mt-1">{startNewChatHintLabel}</p>
			)}
		</div>
	);
}
