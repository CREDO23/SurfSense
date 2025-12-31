import { useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { updateConnectorMutationAtom } from "@/atoms/connectors/connector-mutation.atoms";
import { connectorsAtom } from "@/atoms/connectors/connector-query.atoms";
import { useConnectorFormState } from "@/hooks/connector-edit/use-connector-form-state";
import { useConnectorGithubState } from "@/hooks/connector-edit/use-connector-github-state";
import { useConnectorSave } from "@/hooks/connector-edit/use-connector-save";

export function useConnectorEditPage(connectorId: number, searchSpaceId: string) {
	const { data: connectors = [], isLoading: connectorsLoading } = useAtomValue(connectorsAtom);
	const { mutateAsync: updateConnector } = useAtomValue(updateConnectorMutationAtom);

	const { editForm, patForm, connector, setConnector, originalConfig, setOriginalConfig } =
		useConnectorFormState(connectorId, connectors, connectorsLoading);

	const {
		editMode,
		setEditMode,
		originalPat,
		setOriginalPat,
		currentSelectedRepos,
		setCurrentSelectedRepos,
		fetchedRepos,
		setFetchedRepos,
		newSelectedRepos,
		setNewSelectedRepos,
		isFetchingRepos,
		handleFetchRepositories,
		handleRepoSelectionChange,
	} = useConnectorGithubState();

	const { isSaving, handleSaveChanges } = useConnectorSave({
		connector,
		setConnector,
		originalConfig,
		updateConnector,
		connectorId,
		editForm,
		patForm,
		originalPat,
		setOriginalPat,
		currentSelectedRepos,
		setCurrentSelectedRepos,
		newSelectedRepos,
		setNewSelectedRepos,
		editMode,
		setEditMode,
		fetchedRepos,
		setFetchedRepos,
	});

	return {
		connectorsLoading,
		connector,
		isSaving,
		editForm,
		patForm,
		handleSaveChanges,
		editMode,
		setEditMode,
		originalPat,
		currentSelectedRepos,
		fetchedRepos,
		setFetchedRepos,
		newSelectedRepos,
		setNewSelectedRepos,
		isFetchingRepos,
		handleFetchRepositories,
		handleRepoSelectionChange,
	};
}
