import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { EditMode, GithubRepo } from "@/components/editConnector/types";
import { authenticatedFetch } from "@/lib/auth-utils";
import { arraysEqual } from "@/lib/connector-utils";

export interface GithubStateReturn {
	editMode: EditMode;
	setEditMode: (mode: EditMode) => void;
	originalPat: string;
	setOriginalPat: (pat: string) => void;
	currentSelectedRepos: string[];
	setCurrentSelectedRepos: (repos: string[]) => void;
	fetchedRepos: GithubRepo[] | null;
	setFetchedRepos: (repos: GithubRepo[] | null) => void;
	newSelectedRepos: string[];
	setNewSelectedRepos: (repos: string[]) => void;
	isFetchingRepos: boolean;
	handleFetchRepositories: (pat: string) => Promise<void>;
	handleRepoSelectionChange: (selectedRepos: string[]) => void;
}

export function useConnectorGithubState(): GithubStateReturn {
	const [editMode, setEditMode] = useState<EditMode>("viewing");
	const [originalPat, setOriginalPat] = useState<string>("");
	const [currentSelectedRepos, setCurrentSelectedRepos] = useState<string[]>([]);
	const [fetchedRepos, setFetchedRepos] = useState<GithubRepo[] | null>(null);
	const [newSelectedRepos, setNewSelectedRepos] = useState<string[]>([]);
	const [isFetchingRepos, setIsFetchingRepos] = useState(false);

	const handleFetchRepositories = useCallback(
		async (pat: string) => {
			if (!pat || pat.trim() === "") {
				toast.error("Please enter a GitHub PAT.");
				return;
			}
			setIsFetchingRepos(true);
			try {
				const response = await authenticatedFetch("/api/connectors/list-github-repos", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ github_pat: pat }),
				});
				if (!response.ok) {
					const error = await response.json();
					throw new Error(error.detail || "Failed to fetch repositories.");
				}
				const data = await response.json();
				setFetchedRepos(data.repos || []);
				toast.success("Repositories fetched successfully!");
			} catch (error) {
				console.error("Error fetching repositories:", error);
				toast.error(error instanceof Error ? error.message : "Failed to fetch repositories.");
			} finally {
				setIsFetchingRepos(false);
			}
		},
		[]
	);

	const handleRepoSelectionChange = useCallback((selectedRepos: string[]) => {
		setNewSelectedRepos(selectedRepos);
	}, []);

	return {
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
	};
}
