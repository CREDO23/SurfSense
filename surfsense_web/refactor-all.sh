#!/bin/bash
set -e

# 2. Create remaining DocumentUploadTab helpers
cat > components/sources/upload/upload-progress.tsx << 'ENDFILE'
import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface UploadProgressProps {
	uploadProgress: number;
}

export function UploadProgress({ uploadProgress }: UploadProgressProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="mt-6 space-y-3"
		>
			<Separator />
			<div className="flex items-center gap-3">
				{uploadProgress < 100 ? (
					<Loader2 className="h-5 w-5 animate-spin text-primary" />
				) : (
					<CheckCircle2 className="h-5 w-5 text-green-500" />
				)}
				<div className="flex-1">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium">
							{uploadProgress < 100 ? "Uploading..." : "Upload complete!"}
						</span>
						<span className="text-sm text-muted-foreground">{uploadProgress}%</span>
					</div>
					<Progress value={uploadProgress} className="h-2" />
				</div>
			</div>
		</motion.div>
	);
}
ENDFILE

cat > components/sources/upload/supported-types-card.tsx << 'ENDFILE'
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SupportedTypesCardProps {
	supportedExtensions: string[];
}

export function SupportedTypesCard({ supportedExtensions }: SupportedTypesCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Info className="h-5 w-5" />
					Supported File Types
				</CardTitle>
				<CardDescription>
					You can upload the following file formats
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap gap-2">
					{supportedExtensions.map((ext) => (
						<Badge key={ext} variant="secondary">
							{ext}
						</Badge>
					))}
				</div>
				<Alert className="mt-4">
					<AlertDescription className="text-sm">
						Files are processed automatically and added to your search space.
					</AlertDescription>
				</Alert>
			</CardContent>
		</Card>
	);
}
ENDFILE

echo "Created DocumentUploadTab helpers"

# 3. Refactor all-notes-sidebar (similar to all-chats)
cat > components/sidebar/note-search-header.tsx << 'ENDFILE'
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface NoteSearchHeaderProps {
	searchValue: string;
	onSearchChange: (value: string) => void;
	onClearSearch: () => void;
}

export function NoteSearchHeader({ searchValue, onSearchChange, onClearSearch }: NoteSearchHeaderProps) {
	return (
		<div className="relative">
			<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
			<Input
				placeholder="Search notes..."
				value={searchValue}
				onChange={(e) => onSearchChange(e.target.value)}
				className="pl-9 pr-9"
			/>
			{searchValue && (
				<Button
					variant="ghost"
					size="icon"
					className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
					onClick={onClearSearch}
				>
					<X className="h-3.5 w-3.5" />
				</Button>
			)}
		</div>
	);
}
ENDFILE

cat > components/sidebar/note-archive-tabs.tsx << 'ENDFILE'
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
ENDFILE

cat > components/sidebar/note-item.tsx << 'ENDFILE'
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
ENDFILE

cat > components/sidebar/note-empty-states.tsx << 'ENDFILE'
import { FileText, Search, Archive } from "lucide-react";

interface NoteEmptyStatesProps {
	type: "no-notes" | "no-search-results" | "no-archived";
}

export function NoteEmptyStates({ type }: NoteEmptyStatesProps) {
	const configs = {
		"no-notes": {
			icon: FileText,
			title: "No notes yet",
			description: "Create your first note to get started",
		},
		"no-search-results": {
			icon: Search,
			title: "No matching notes",
			description: "Try adjusting your search",
		},
		"no-archived": {
			icon: Archive,
			title: "No archived notes",
			description: "Archived notes will appear here",
		},
	};

	const config = configs[type];
	const Icon = config.icon;

	return (
		<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
			<Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
			<h3 className="text-sm font-medium text-muted-foreground mb-1">{config.title}</h3>
			<p className="text-xs text-muted-foreground/70">{config.description}</p>
		</div>
	);
}
ENDFILE

echo "Created all-notes-sidebar helpers"

echo "All component files created successfully!"
