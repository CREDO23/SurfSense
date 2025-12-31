import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RoleManagerAlertsProps {
	isLoading: boolean;
	hasError: boolean;
	isAssignmentComplete: boolean;
}

export function RoleManagerAlerts({
	isLoading,
	hasError,
	isAssignmentComplete,
}: RoleManagerAlertsProps) {
	return (
		<>
			{isLoading && (
				<Alert className="border-blue-200 bg-blue-50/50">
					<Loader2 className="h-4 w-4 animate-spin text-blue-600" />
					<AlertDescription className="text-xs md:text-sm">
						Loading LLM configurations and preferences...
					</AlertDescription>
				</Alert>
			)}

			{hasError && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription className="text-xs md:text-sm">
						Failed to load configurations or preferences. Please try refreshing.
					</AlertDescription>
				</Alert>
			)}

			{isAssignmentComplete && (
				<Alert className="border-green-200 bg-green-50/50">
					<CheckCircle className="h-4 w-4 text-green-600" />
					<AlertDescription className="text-xs md:text-sm text-green-800">
						All roles have been assigned! Your LLM configuration is complete.
					</AlertDescription>
				</Alert>
			)}

			{!isLoading && !isAssignmentComplete && !hasError && (
				<Alert className="border-amber-200 bg-amber-50/50">
					<AlertCircle className="h-4 w-4 text-amber-600" />
					<AlertDescription className="text-xs md:text-sm text-amber-800">
						Assign LLM configurations to each role for optimal AI interactions.
					</AlertDescription>
				</Alert>
			)}
		</>
	);
}
