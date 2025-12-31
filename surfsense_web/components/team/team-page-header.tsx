import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeamPageHeaderProps {
	searchSpaceId: number;
	onBack: () => void;
	onRefresh: () => void;
}

export function TeamPageHeader({ searchSpaceId, onBack, onRefresh }: TeamPageHeaderProps) {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={onBack}
					className="rounded-full"
				>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div>
					<h1 className="text-3xl font-bold">Team Management</h1>
					<p className="text-muted-foreground mt-1">
						Manage members, roles, and permissions for your workspace
					</p>
				</div>
			</div>

			<Button
				variant="outline"
				size="icon"
				onClick={onRefresh}
				className="rounded-full"
			>
				<RefreshCw className="h-4 w-4" />
			</Button>
		</div>
	);
}
