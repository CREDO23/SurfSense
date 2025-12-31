import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { LLMConfigForm, type LLMConfigFormData } from "@/components/shared/llm-config-form";
import type { NewLLMConfig } from "@/contracts/types/new-llm-config.types";
import { Edit3, Loader2, Plus, Trash2 } from "lucide-react";

interface ModelConfigDialogsProps {
	isDialogOpen: boolean;
	editingConfig: NewLLMConfig | null;
	configToDelete: NewLLMConfig | null;
	searchSpaceId: number;
	onSubmit: (data: LLMConfigFormData) => void;
	onDelete: () => void;
	onCloseDialog: () => void;
	onCloseDeleteDialog: () => void;
	isSubmitting: boolean;
	isDeleting: boolean;
}

export function ModelConfigDialogs({
	isDialogOpen,
	editingConfig,
	configToDelete,
	searchSpaceId,
	onSubmit,
	onDelete,
	onCloseDialog,
	onCloseDeleteDialog,
	isSubmitting,
	isDeleting,
}: ModelConfigDialogsProps) {
	return (
		<>
			{/* Add/Edit Configuration Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={(open) => !open && onCloseDialog()}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							{editingConfig ? (
								<Edit3 className="w-5 h-5 text-violet-600" />
							) : (
								<Plus className="w-5 h-5 text-violet-600" />
							)}
							{editingConfig ? "Edit Configuration" : "Create New Configuration"}
						</DialogTitle>
						<DialogDescription>
							{editingConfig
								? "Update your AI model and prompt configuration"
								: "Set up a new AI model with custom prompts and citation settings"}
						</DialogDescription>
					</DialogHeader>

					<LLMConfigForm
						key={editingConfig ? `edit-${editingConfig.id}` : "create"}
						searchSpaceId={searchSpaceId}
						initialData={
							editingConfig
								? {
										name: editingConfig.name,
										description: editingConfig.description || "",
										provider: editingConfig.provider,
										custom_provider: editingConfig.custom_provider || "",
										model_name: editingConfig.model_name,
										api_key: editingConfig.api_key,
										api_base: editingConfig.api_base || "",
										litellm_params: editingConfig.litellm_params || {},
										system_instructions: editingConfig.system_instructions || "",
										use_default_system_instructions:
											editingConfig.use_default_system_instructions,
										citations_enabled: editingConfig.citations_enabled,
									}
								: {
										citations_enabled: true,
										use_default_system_instructions: true,
									}
						}
						onSubmit={onSubmit}
						onCancel={onCloseDialog}
						isSubmitting={isSubmitting}
						mode={editingConfig ? "edit" : "create"}
						showAdvanced={true}
						compact={true}
					/>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={!!configToDelete}
				onOpenChange={(open) => !open && onCloseDeleteDialog()}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							<Trash2 className="h-5 w-5 text-destructive" />
							Delete Configuration
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete{" "}
							<span className="font-semibold text-foreground">
								{configToDelete?.name}
							</span>
							? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={onDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								<>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</>
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
