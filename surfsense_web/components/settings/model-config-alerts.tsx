import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Sparkles } from "lucide-react";

interface ModelConfigAlertsProps {
	errors: Error[];
	globalConfigs: unknown[];
}

export function ModelConfigAlerts({ errors, globalConfigs }: ModelConfigAlertsProps) {
	return (
		<>
			{errors.length > 0 && (
				<Alert variant="destructive" className="mb-4">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						{errors.map((error) => error.message).join(", ")}
					</AlertDescription>
				</Alert>
			)}

			{globalConfigs.length > 0 && (
				<Alert className="border-blue-500/30 bg-blue-500/10">
					<Sparkles className="h-4 w-4 text-blue-600" />
					<AlertDescription className="text-blue-700 dark:text-blue-300">
						You have <span className="font-semibold">{globalConfigs.length}</span> global
						configuration{globalConfigs.length > 1 ? "s" : ""} available from your admin.
					</AlertDescription>
				</Alert>
			)}
		</>
	);
}
