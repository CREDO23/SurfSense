import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function ModelConfigLoading() {
	return (
		<Card>
			<CardContent className="flex items-center justify-center py-10 md:py-16">
				<div className="flex flex-col items-center gap-3 md:gap-4">
					<Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-violet-600" />
					<span className="text-sm text-muted-foreground">Loading configurations...</span>
				</div>
			</CardContent>
		</Card>
	);
}
