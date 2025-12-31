"use client";

import { Plus, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ModelConfigAlerts } from "@/components/settings/model-config-alerts";
import { ModelConfigCard } from "@/components/settings/model-config-card";
import { ModelConfigDialogs } from "@/components/settings/model-config-dialogs";
import { ModelConfigEmptyState } from "@/components/settings/model-config-empty-state";
import { ModelConfigLoading } from "@/components/settings/model-config-loading";
import { Button } from "@/components/ui/button";
import { useModelConfigManager } from "@/hooks/use-model-config-manager";

interface ModelConfigManagerProps {
	searchSpaceId: number;
}

const container = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.05,
		},
	},
};

const item = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 },
};

export function ModelConfigManager({ searchSpaceId }: ModelConfigManagerProps) {
	const {
		configs,
		globalConfigs,
		isLoading,
		errors,
		isDialogOpen,
		editingConfig,
		configToDelete,
		handleFormSubmit,
		handleDelete,
		openEditDialog,
		openNewDialog,
		closeDialog,
		openDeleteDialog,
		closeDeleteDialog,
		isSubmitting,
		isDeleting,
		refreshConfigs,
	} = useModelConfigManager(searchSpaceId);

	return (
		<div className="space-y-6">
			<ModelConfigAlerts errors={errors} globalConfigs={globalConfigs} />

			{isLoading && <ModelConfigLoading />}

			{!isLoading && (
				<div className="space-y-4 md:space-y-6">
					{configs?.length === 0 ? (
						<ModelConfigEmptyState onCreateNew={openNewDialog} />
					) : (
						<div className="space-y-4 md:space-y-6">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
								<div className="space-y-1">
									<h3 className="text-base md:text-lg font-semibold tracking-tight">
										Your Configurations
									</h3>
									<p className="text-xs md:text-sm text-muted-foreground">
										Manage your AI model configurations for this space
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => refreshConfigs()}
										className="h-8 md:h-9"
									>
										<RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4" />
										<span className="ml-2 hidden sm:inline">Refresh</span>
									</Button>
									<Button onClick={openNewDialog} size="sm" className="h-8 md:h-9">
										<Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
										<span className="ml-2">Add Configuration</span>
									</Button>
								</div>
							</div>

							<motion.div variants={container} initial="hidden" animate="show">
								<AnimatePresence mode="popLayout">
									{configs?.map((config) => (
										<ModelConfigCard
											key={config.id}
											config={config}
											onEdit={openEditDialog}
											onDelete={openDeleteDialog}
											item={item}
										/>
									))}
								</AnimatePresence>
							</motion.div>
						</div>
					)}
				</div>
			)}

			<ModelConfigDialogs
				isDialogOpen={isDialogOpen}
				editingConfig={editingConfig}
				configToDelete={configToDelete}
				searchSpaceId={searchSpaceId}
				onSubmit={handleFormSubmit}
				onDelete={handleDelete}
				onCloseDialog={closeDialog}
				onCloseDeleteDialog={closeDeleteDialog}
				isSubmitting={isSubmitting}
				isDeleting={isDeleting}
			/>
		</div>
	);
}
