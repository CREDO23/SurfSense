import { FileText, MoreVertical, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NoteItemProps {
	note: any;
	isActive: boolean;
	onClick: () => void;
	onArchive?: (noteId: number) => void;
	onDelete?: (noteId: number) => void;
}

export function NoteItem({ note, isActive, onClick, onArchive, onDelete }: NoteItemProps) {
	return (
		<div
			className={cn(
				"group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
				isActive
					? "bg-accent text-accent-foreground"
					: "hover:bg-accent/50"
			)}
			onClick={onClick}
		>
			<FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium truncate">{note.title || "Untitled Note"}</p>
				<p className="text-xs text-muted-foreground truncate">{note.preview}</p>
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100"
					>
						<MoreVertical className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{onArchive && (
						<DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(note.id); }}>
							<Archive className="mr-2 h-4 w-4" />
							Archive
						</DropdownMenuItem>
					)}
					{onDelete && (
						<DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} className="text-destructive">
							<Trash2 className="mr-2 h-4 w-4" />
							Delete
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
