import { Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleManagerActionsProps {
	hasChanges: boolean;
	isSaving: boolean;
	onSave: () => void;
	onReset: () => void;
}

export function RoleManagerActions({
	hasChanges,
	isSaving,
	onSave,
	onReset,
}: RoleManagerActionsProps) {
	if (!hasChanges) return null;

	return (
		<div className="flex justify-center gap-2 md:gap-3 pt-3 md:pt-4">
			<Button
				onClick={onSave}
				disabled={isSaving}
				className="flex items-center gap-2 text-xs md:text-sm h-9 md:h-10"
			>
				<Save className="w-3.5 h-3.5 md:w-4 md:h-4" />
				{isSaving ? "Saving..." : "Save Changes"}
			</Button>
			<Button
				variant="outline"
				onClick={onReset}
				disabled={isSaving}
				className="flex items-center gap-2 text-xs md:text-sm h-9 md:h-10"
			>
				<RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
				Reset
			</Button>
		</div>
	);
}
