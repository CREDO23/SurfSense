import { Loader2 } from "lucide-react";

export function TeamLoadingState() {
	return (
		<div className="flex h-[50vh] items-center justify-center">
			<div className="text-center space-y-4">
				<Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
				<p className="text-sm text-muted-foreground">Loading team management...</p>
			</div>
		</div>
	);
}
