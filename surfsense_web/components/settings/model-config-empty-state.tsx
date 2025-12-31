import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wand2 } from "lucide-react";

interface ModelConfigEmptyStateProps {
	onCreateNew: () => void;
}

export function ModelConfigEmptyState({ onCreateNew }: ModelConfigEmptyStateProps) {
	return (
		<Card className="border-dashed border-2">
			<CardContent className="flex flex-col items-center justify-center py-10 md:py-16 space-y-4 md:space-y-6">
				<div className="rounded-full bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 p-4 md:p-6">
					<Wand2 className="w-8 h-8 md:w-12 md:h-12 text-violet-600" />
				</div>
				<div className="text-center space-y-2">
					<h3 className="text-lg md:text-xl font-semibold">No Configurations Yet</h3>
					<p className="text-sm text-muted-foreground max-w-md">
						Create your first AI configuration to customize how your assistant responds
					</p>
				</div>
				<Button onClick={onCreateNew} className="mt-2" size="lg">
					<Wand2 className="mr-2 h-4 w-4" />
					Create First Configuration
				</Button>
			</CardContent>
		</Card>
	);
}
