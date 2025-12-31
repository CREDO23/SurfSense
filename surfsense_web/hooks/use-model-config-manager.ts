import { useAtomValue } from "jotai";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
	createNewLLMConfigMutationAtom,
	deleteNewLLMConfigMutationAtom,
	updateNewLLMConfigMutationAtom,
} from "@/atoms/new-llm-config/new-llm-config-mutation.atoms";
import {
	globalNewLLMConfigsAtom,
	newLLMConfigsAtom,
} from "@/atoms/new-llm-config/new-llm-config-query.atoms";
import type { LLMConfigFormData } from "@/components/shared/llm-config-form";
import type { NewLLMConfig } from "@/contracts/types/new-llm-config.types";

export function useModelConfigManager(searchSpaceId: number) {
	// Mutations
	const {
		mutateAsync: createConfig,
		isPending: isCreating,
		error: createError,
	} = useAtomValue(createNewLLMConfigMutationAtom);
	const {
		mutateAsync: updateConfig,
		isPending: isUpdating,
		error: updateError,
	} = useAtomValue(updateNewLLMConfigMutationAtom);
	const {
		mutateAsync: deleteConfig,
		isPending: isDeleting,
		error: deleteError,
	} = useAtomValue(deleteNewLLMConfigMutationAtom);

	// Queries
	const {
		data: configs,
		isFetching: isLoading,
		error: fetchError,
		refetch: refreshConfigs,
	} = useAtomValue(newLLMConfigsAtom);
	const { data: globalConfigs = [] } = useAtomValue(globalNewLLMConfigsAtom);

	// Local state
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingConfig, setEditingConfig] = useState<NewLLMConfig | null>(null);
	const [configToDelete, setConfigToDelete] = useState<NewLLMConfig | null>(null);

	const isSubmitting = isCreating || isUpdating;
	const errors = [createError, updateError, deleteError, fetchError].filter(Boolean) as Error[];

	const handleFormSubmit = useCallback(
		async (data: LLMConfigFormData) => {
			try {
				if (editingConfig) {
					await updateConfig({ ...data, id: editingConfig.id, searchSpaceId });
					toast.success("Configuration updated successfully");
				} else {
					await createConfig({ ...data, searchSpaceId });
					toast.success("Configuration created successfully");
				}
				setIsDialogOpen(false);
				setEditingConfig(null);
			} catch (error) {
				toast.error(editingConfig ? "Failed to update configuration" : "Failed to create configuration");
			}
		},
		[createConfig, editingConfig, searchSpaceId, updateConfig],
	);

	const handleDelete = async () => {
		if (!configToDelete) return;
		try {
			await deleteConfig({ id: configToDelete.id, searchSpaceId });
			toast.success("Configuration deleted successfully");
			setConfigToDelete(null);
		} catch (error) {
			toast.error("Failed to delete configuration");
		}
	};

	const openEditDialog = (config: NewLLMConfig) => {
		setEditingConfig(config);
		setIsDialogOpen(true);
	};

	const openNewDialog = () => {
		setEditingConfig(null);
		setIsDialogOpen(true);
	};

	const closeDialog = () => {
		setIsDialogOpen(false);
		setEditingConfig(null);
	};

	const openDeleteDialog = (config: NewLLMConfig) => {
		setConfigToDelete(config);
	};

	const closeDeleteDialog = () => {
		setConfigToDelete(null);
	};

	return {
		// Data
		configs,
		globalConfigs,
		isLoading,
		errors,
		// Dialog state
		isDialogOpen,
		editingConfig,
		configToDelete,
		// Actions
		handleFormSubmit,
		handleDelete,
		openEditDialog,
		openNewDialog,
		closeDialog,
		openDeleteDialog,
		closeDeleteDialog,
		refreshConfigs,
		// Loading states
		isSubmitting,
		isDeleting,
	};
}
