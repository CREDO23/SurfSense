import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateLLMPreferencesMutationAtom } from "@/atoms/new-llm-config/new-llm-config-mutation.atoms";
import { llmPreferencesAtom } from "@/atoms/new-llm-config/new-llm-config-query.atoms";

interface RoleAssignments {
	agent_llm_id: string | number;
	document_summary_llm_id: string | number;
}

export function useLLMRoleAssignments(searchSpaceId: number) {
	const {
		data: preferences = {},
		isFetching: preferencesLoading,
		error: preferencesError,
		refetch: refreshPreferences,
	} = useAtomValue(llmPreferencesAtom);

	const { mutateAsync: updatePreferences } = useAtomValue(updateLLMPreferencesMutationAtom);

	const [assignments, setAssignments] = useState<RoleAssignments>({
		agent_llm_id: preferences.agent_llm_id || "",
		document_summary_llm_id: preferences.document_summary_llm_id || "",
	});

	const [hasChanges, setHasChanges] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		const newAssignments = {
			agent_llm_id: preferences.agent_llm_id || "",
			document_summary_llm_id: preferences.document_summary_llm_id || "",
		};
		setAssignments(newAssignments);
		setHasChanges(false);
	}, [preferences]);

	const handleRoleAssignment = (role: string, configId: string) => {
		const newAssignments = {
			...assignments,
			[role]: configId === "unassigned" ? "" : parseInt(configId),
		};

		setAssignments(newAssignments);

		const currentPrefs: RoleAssignments = {
			agent_llm_id: preferences.agent_llm_id || "",
			document_summary_llm_id: preferences.document_summary_llm_id || "",
		};

		const hasChangesNow = Object.keys(newAssignments).some(
			(key) =>
				newAssignments[key as keyof RoleAssignments] !==
				currentPrefs[key as keyof RoleAssignments]
		);

		setHasChanges(hasChangesNow);
	};

	const handleSave = async () => {
		setIsSaving(true);

		const numericAssignments = {
			agent_llm_id:
				typeof assignments.agent_llm_id === "string"
					? assignments.agent_llm_id
						? parseInt(assignments.agent_llm_id)
						: undefined
					: assignments.agent_llm_id,
			document_summary_llm_id:
				typeof assignments.document_summary_llm_id === "string"
					? assignments.document_summary_llm_id
						? parseInt(assignments.document_summary_llm_id)
						: undefined
					: assignments.document_summary_llm_id,
		};

		await updatePreferences({
			search_space_id: searchSpaceId,
			data: numericAssignments,
		});

		setHasChanges(false);
		toast.success("LLM role assignments saved successfully!");
		setIsSaving(false);
	};

	const handleReset = () => {
		setAssignments({
			agent_llm_id: preferences.agent_llm_id || "",
			document_summary_llm_id: preferences.document_summary_llm_id || "",
		});
		setHasChanges(false);
	};

	const isAssignmentComplete = assignments.agent_llm_id && assignments.document_summary_llm_id;

	return {
		assignments,
		hasChanges,
		isSaving,
		isAssignmentComplete,
		preferencesLoading,
		preferencesError,
		handleRoleAssignment,
		handleSave,
		handleReset,
		refreshPreferences,
	};
}
