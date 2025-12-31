"use client";

import { useAtomValue } from "jotai";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import {
	globalNewLLMConfigsAtom,
	newLLMConfigsAtom,
} from "@/atoms/new-llm-config/new-llm-config-query.atoms";
import { useLLMRoleAssignments } from "@/hooks/use-llm-role-assignments";
import { ROLE_DESCRIPTIONS } from "@/lib/llm-roles/role-descriptions";
import { RoleAssignmentCard } from "@/components/settings/llm-role/role-assignment-card";
import { RoleManagerHeader } from "@/components/settings/llm-role/role-manager-header";
import { RoleManagerAlerts } from "@/components/settings/llm-role/role-manager-alerts";
import { RoleManagerActions } from "@/components/settings/llm-role/role-manager-actions";

interface LLMRoleManagerProps {
	searchSpaceId: number;
}

export function LLMRoleManager({ searchSpaceId }: LLMRoleManagerProps) {
	const {
		data: newLLMConfigs = [],
		isFetching: configsLoading,
		error: configsError,
		refetch: refreshConfigs,
	} = useAtomValue(newLLMConfigsAtom);
	const {
		data: globalConfigs = [],
		isFetching: globalConfigsLoading,
		error: globalConfigsError,
		refetch: refreshGlobalConfigs,
	} = useAtomValue(globalNewLLMConfigsAtom);

	// Use role assignments hook
	const {
		assignments,
		hasChanges,
		isSaving,
		isAssignmentComplete,
		preferencesLoading,
		preferencesError,
		refreshPreferences,
		handleRoleAssignment,
		handleSave,
		handleReset,
	} = useLLMRoleAssignments(searchSpaceId);

	const isLoading = configsLoading || globalConfigsLoading || preferencesLoading;
	const hasError = configsError || globalConfigsError || preferencesError;

	// Combine global and custom configs
	const allConfigs = [
		...globalConfigs.map((config) => ({ ...config, is_global: true })),
		...newLLMConfigs.filter((config) => config.id && config.id.toString().trim() !== ""),
	];

	return (
		<div className="space-y-4 md:space-y-6">
			<RoleManagerHeader
				isLoading={isLoading}
				onRefresh={() => {
					refreshConfigs();
					refreshGlobalConfigs();
					refreshPreferences();
				}}
			/>

			<RoleManagerAlerts
				isLoading={isLoading}
				hasError={hasError}
				isComplete={isAssignmentComplete}
			/>

			{/* Loading State */}
			{isLoading && (
				<div className="flex items-center justify-center py-8 md:py-12">
					<div className="flex flex-col items-center gap-2 md:gap-3">
						<Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-primary" />
						<p className="text-xs md:text-sm text-muted-foreground">Loading configurations...</p>
					</div>
				</div>
			)}

			{/* Main Content */}
			{!isLoading && !hasError && (
				<div className="space-y-4">
					<div className="grid gap-4 md:gap-6 lg:grid-cols-2">
						{Object.entries(ROLE_DESCRIPTIONS).map(([key, roleInfo], index) => {
							return (
								<RoleAssignmentCard
									key={key}
									roleKey={key}
									roleInfo={roleInfo}
									assignments={assignments}
									allConfigs={allConfigs}
									globalConfigs={globalConfigs}
									newLLMConfigs={newLLMConfigs}
									onRoleAssignment={handleRoleAssignment}
									animationDelay={index * 0.1}
								/>
							);
						})}
					</div>

					<RoleManagerActions
						hasChanges={hasChanges}
						isSaving={isSaving}
						onSave={handleSave}
						onReset={handleReset}
					/>
				</div>
			)}
		</div>
	);
}
