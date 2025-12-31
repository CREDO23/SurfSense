import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EditorLoadingState() {
	return (
		<div className="flex items-center justify-center min-h-[400px] p-6">
			<Card className="w-full max-w-md">
				<CardContent className="flex flex-col items-center justify-center py-12">
					<Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
					<p className="text-muted-foreground">Loading editor...</p>
				</CardContent>
			</Card>
		</div>
	);
}
