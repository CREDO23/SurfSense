import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleManagerHeaderProps {
	isLoading: boolean;
	configsLoading: boolean;
	preferencesLoading: boolean;
	onRefreshConfigs: () => void;
	onRefreshPreferences: () => void;
}

export function RoleManagerHeader({
	isLoading,
	configsLoading,
	preferencesLoading,
	onRefreshConfigs,
	onRefreshPreferences,
}: RoleManagerHeaderProps) {
	return (
		<div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
			<div className="flex flex-wrap gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={onRefreshConfigs}
					disabled={isLoading}
					className="flex items-center gap-2 text-xs md:text-sm h-8 md:h-9"
				>
					<RefreshCw className={`h-3 w-3 md:h-4 md:w-4 ${configsLoading ? "animate-spin" : ""}`} />
					<span className="hidden sm:inline">Refresh Configs</span>
					<span className="sm:hidden">Configs</span>
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={onRefreshPreferences}
					disabled={isLoading}
					className="flex items-center gap-2 text-xs md:text-sm h-8 md:h-9"
				>
					<RefreshCw
						className={`h-3 w-3 md:h-4 md:w-4 ${preferencesLoading ? "animate-spin" : ""}`}
					/>
					<span className="hidden sm:inline">Refresh Preferences</span>
					<span className="sm:hidden">Prefs</span>
				</Button>
			</div>
		</div>
	);
}
