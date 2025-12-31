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
