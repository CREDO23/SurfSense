import { cn } from "@/lib/utils";

interface ChatArchiveTabsProps {
	showArchived: boolean;
	onShowArchivedChange: (showArchived: boolean) => void;
	activeCount: number;
	archivedCount: number;
	isSearchMode?: boolean;
}

export function ChatArchiveTabs({
	showArchived,
	onShowArchivedChange,
	activeCount,
	archivedCount,
	isSearchMode = false,
}: ChatArchiveTabsProps) {
	// Don't show tabs when in search mode
	if (isSearchMode) return null;

	return (
		<div className="flex-shrink-0 flex border-b mx-4">
			<button
				type="button"
				onClick={() => onShowArchivedChange(false)}
				className={cn(
					"flex-1 px-3 py-2 text-center text-xs font-medium transition-colors",
					!showArchived
						? "border-b-2 border-primary text-primary"
						: "text-muted-foreground hover:text-foreground"
				)}
			>
				Active ({activeCount})
			</button>
			<button
				type="button"
				onClick={() => onShowArchivedChange(true)}
				className={cn(
					"flex-1 px-3 py-2 text-center text-xs font-medium transition-colors",
					showArchived
						? "border-b-2 border-primary text-primary"
						: "text-muted-foreground hover:text-foreground"
				)}
			>
				Archived ({archivedCount})
			</button>
		</div>
	);
}
