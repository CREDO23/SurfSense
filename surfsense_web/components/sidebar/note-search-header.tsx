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
