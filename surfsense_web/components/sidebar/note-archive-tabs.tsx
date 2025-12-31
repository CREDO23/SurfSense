import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoteArchiveTabsProps {
	showArchived: boolean;
	onToggleArchived: () => void;
}

export function NoteArchiveTabs({ showArchived, onToggleArchived }: NoteArchiveTabsProps) {
	return (
		<div className="flex gap-1 p-1 bg-muted rounded-lg">
			<Button
				variant={!showArchived ? "default" : "ghost"}
				size="sm"
				className="flex-1"
				onClick={() => !showArchived || onToggleArchived()}
			>
				Active
			</Button>
			<Button
				variant={showArchived ? "default" : "ghost"}
				size="sm"
				className="flex-1 gap-2"
				onClick={() => showArchived || onToggleArchived()}
			>
				<Archive className="h-4 w-4" />
				Archived
			</Button>
		</div>
	);
}
