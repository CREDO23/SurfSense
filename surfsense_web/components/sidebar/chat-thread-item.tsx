import { format } from "date-fns";
import {
	ArchiveIcon,
	Loader2,
	MessageCircleMore,
	MoreHorizontal,
	RotateCcwIcon,
	Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ThreadListItem } from "@/lib/chat/thread-persistence";
import { cn } from "@/lib/utils";

interface ChatThreadItemProps {
	thread: ThreadListItem;
	isActive: boolean;
	isDeleting: boolean;
	isArchiving: boolean;
	onThreadClick: (threadId: number) => void;
	onDeleteThread: (threadId: number) => void;
	onToggleArchive: (threadId: number, currentlyArchived: boolean) => void;
	openDropdownId: number | null;
	onOpenDropdownChange: (threadId: number | null) => void;
	// Translation labels
	updatedLabel?: string;
	moreOptionsLabel?: string;
	unarchiveLabel?: string;
	archiveLabel?: string;
	deleteLabel?: string;
}

export function ChatThreadItem({
	thread,
	isActive,
	isDeleting,
	isArchiving,
	onThreadClick,
	onDeleteThread,
	onToggleArchive,
	openDropdownId,
	onOpenDropdownChange,
	updatedLabel = "Updated",
	moreOptionsLabel = "More options",
	unarchiveLabel = "Restore",
	archiveLabel = "Archive",
	deleteLabel = "Delete",
}: ChatThreadItemProps) {
	const isBusy = isDeleting || isArchiving;

	return (
		<div
			key={thread.id}
			className={cn(
				"group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
				"hover:bg-accent hover:text-accent-foreground",
				"transition-colors cursor-pointer",
				isActive && "bg-accent text-accent-foreground",
				isBusy && "opacity-50 pointer-events-none"
			)}
		>
			{/* Main clickable area for navigation */}
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						onClick={() => onThreadClick(thread.id)}
						disabled={isBusy}
						className="flex items-center gap-2 flex-1 min-w-0 text-left overflow-hidden"
					>
						<MessageCircleMore className="h-4 w-4 shrink-0 text-muted-foreground" />
						<span className="truncate">{thread.title || "New Chat"}</span>
					</button>
				</TooltipTrigger>
				<TooltipContent side="bottom" align="start">
					<p>
						{updatedLabel}: {format(new Date(thread.updatedAt), "MMM d, yyyy 'at' h:mm a")}
					</p>
				</TooltipContent>
			</Tooltip>

			{/* Actions dropdown */}
			<DropdownMenu
				open={openDropdownId === thread.id}
				onOpenChange={(isOpen) => onOpenDropdownChange(isOpen ? thread.id : null)}
			>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className={cn(
							"h-6 w-6 shrink-0",
							"md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100",
							"transition-opacity"
						)}
						disabled={isBusy}
					>
						{isDeleting ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<MoreHorizontal className="h-3.5 w-3.5" />
						)}
						<span className="sr-only">{moreOptionsLabel}</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-40 z-[80]">
					<DropdownMenuItem
						onClick={() => onToggleArchive(thread.id, thread.archived)}
						disabled={isArchiving}
					>
						{thread.archived ? (
							<>
								<RotateCcwIcon className="mr-2 h-4 w-4" />
								<span>{unarchiveLabel}</span>
							</>
						) : (
							<>
								<ArchiveIcon className="mr-2 h-4 w-4" />
								<span>{archiveLabel}</span>
							</>
						)}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={() => onDeleteThread(thread.id)}
						className="text-destructive focus:text-destructive"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						<span>{deleteLabel}</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
