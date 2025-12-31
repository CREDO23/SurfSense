import { ArrowLeft, FileText, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorToolbarProps {
	displayTitle: string;
	hasUnsavedChanges: boolean;
	saving: boolean;
	isNewNote: boolean;
	onBack: () => void;
	onSave: () => void;
}

export function EditorToolbar({
	displayTitle,
	hasUnsavedChanges,
	saving,
	isNewNote,
	onBack,
	onSave,
}: EditorToolbarProps) {
	return (
		<div className="flex items-center justify-between gap-3 p-3 md:p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
			<div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
				<FileText className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
				<div className="flex flex-col min-w-0">
					<h1 className="text-base md:text-lg font-semibold truncate">{displayTitle}</h1>
					{hasUnsavedChanges && (
						<p className="text-[10px] md:text-xs text-muted-foreground">Unsaved changes</p>
					)}
				</div>
			</div>

			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					onClick={onBack}
					disabled={saving}
					className="gap-1 md:gap-2 px-2 md:px-4 h-8 md:h-10"
				>
					<ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
					<span className="text-xs md:text-sm">Back</span>
				</Button>
				<Button onClick={onSave} disabled={saving} className="gap-1 md:gap-2 px-2 md:px-4 h-8 md:h-10">
					{saving ? (
						<>
							<Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
							<span className="text-xs md:text-sm">{isNewNote ? "Creating..." : "Saving..."}</span>
						</>
					) : (
						<>
							<Save className="h-3.5 w-3.5 md:h-4 md:w-4" />
							<span className="text-xs md:text-sm">Save</span>
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
