import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatSearchHeaderProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	onClearSearch: () => void;
	placeholder?: string;
	clearLabel?: string;
}

export function ChatSearchHeader({
	searchQuery,
	onSearchChange,
	onClearSearch,
	placeholder = "Search chats...",
	clearLabel = "Clear search",
}: ChatSearchHeaderProps) {
	return (
		<div className="relative">
			<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
			<Input
				type="text"
				placeholder={placeholder}
				value={searchQuery}
				onChange={(e) => onSearchChange(e.target.value)}
				className="pl-9 pr-8 h-9"
			/>
			{searchQuery && (
				<Button
					variant="ghost"
					size="icon"
					className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
					onClick={onClearSearch}
				>
					<X className="h-3.5 w-3.5" />
					<span className="sr-only">{clearLabel}</span>
				</Button>
			)}
		</div>
	);
}
