import { useCallback, useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import type { EditConnectorFormValues, EditMode, GithubPatFormValues } from "@/components/editConnector/types";
import type { SearchSourceConnector } from "@/hooks/use-search-source-connectors";
import { arraysEqual, normalizeBoolean, normalizeListInput } from "@/lib/connector-utils";

export interface SaveOperationsReturn {
	isSaving: boolean;
	handleSaveChanges: () => Promise<void>;
}

interface SaveOperationsParams {
	connector: SearchSourceConnector | null;
	setConnector: (connector: SearchSourceConnector | null) => void;
	originalConfig: Record<string, any> | null;
	updateConnector: (params: any) => Promise<any>;
	connectorId: number;
	editForm: UseFormReturn<EditConnectorFormValues>;
	patForm: UseFormReturn<GithubPatFormValues>;
	originalPat: string;
	setOriginalPat: (pat: string) => void;
	currentSelectedRepos: string[];
	setCurrentSelectedRepos: (repos: string[]) => void;
	newSelectedRepos: string[];
	setNewSelectedRepos: (repos: string[]) => void;
	editMode: EditMode;
	setEditMode: (mode: EditMode) => void;
	fetchedRepos: any;
	setFetchedRepos: (repos: any) => void;
}

export function useConnectorSave(params: SaveOperationsParams): SaveOperationsReturn {
	const {
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
	} = params;

	const [isSaving, setIsSaving] = useState(false);

	const handleSaveChanges = useCallback(
		async () => {
			if (!connector) return;

			let nameChanged = false;
			let configChanged = false;
			let newConfig: Record<string, any> = { ...(originalConfig || {}) };

			if (connector.connector_type === "GITHUB_CONNECTOR") {
				const patValue = patForm.getValues("github_pat");
				if (patValue !== originalPat) {
					newConfig.GITHUB_PAT = patValue;
					configChanged = true;
				}
				if (!arraysEqual(newSelectedRepos, currentSelectedRepos)) {
					newConfig.repo_full_names = newSelectedRepos;
					configChanged = true;
				}
			} else {
				const formValues = editForm.getValues();
				const newName = formValues.name.trim();
				if (newName !== connector.name) {
					nameChanged = true;
				}
				const connectorType = connector.connector_type;
				if (connectorType === "SLACK_CONNECTOR") {
					const newToken = formValues.SLACK_BOT_TOKEN?.trim() || "";
					if (newToken !== (originalConfig?.SLACK_BOT_TOKEN || "")) {
						newConfig.SLACK_BOT_TOKEN = newToken;
						configChanged = true;
					}
				} else if (connectorType === "NOTION_CONNECTOR") {
					const newToken = formValues.NOTION_INTEGRATION_TOKEN?.trim() || "";
					if (newToken !== (originalConfig?.NOTION_INTEGRATION_TOKEN || "")) {
						newConfig.NOTION_INTEGRATION_TOKEN = newToken;
						configChanged = true;
					}
				} else if (connectorType === "TAVILY_API") {
					const newKey = formValues.TAVILY_API_KEY?.trim() || "";
					if (newKey !== (originalConfig?.TAVILY_API_KEY || "")) {
						newConfig.TAVILY_API_KEY = newKey;
						configChanged = true;
					}
				} else if (connectorType === "SEARXNG_API") {
					const newHost = formValues.SEARXNG_HOST?.trim() || "";
					const newApiKey = formValues.SEARXNG_API_KEY?.trim() || "";
					const newEngines = normalizeListInput(formValues.SEARXNG_ENGINES);
					const newCategories = normalizeListInput(formValues.SEARXNG_CATEGORIES);
					const newLang = formValues.SEARXNG_LANGUAGE?.trim() || "";
					const newSafeSearch = formValues.SEARXNG_SAFESEARCH?.trim() || "";
					const newVerifySSL = formValues.SEARXNG_VERIFY_SSL?.trim() || "";
					const oldEngines = normalizeListInput(originalConfig?.SEARXNG_ENGINES);
					const oldCategories = normalizeListInput(originalConfig?.SEARXNG_CATEGORIES);
					const oldSafeSearch =
						originalConfig?.SEARXNG_SAFESEARCH === null ||
						originalConfig?.SEARXNG_SAFESEARCH === undefined
							? ""
							: String(originalConfig?.SEARXNG_SAFESEARCH);
					const oldVerifyValue = normalizeBoolean(originalConfig?.SEARXNG_VERIFY_SSL);
					const oldVerifySSL = oldVerifyValue === null ? "" : String(oldVerifyValue);
					if (
						newHost !== (originalConfig?.SEARXNG_HOST || "") ||
						newApiKey !== (originalConfig?.SEARXNG_API_KEY || "") ||
						!arraysEqual(newEngines, oldEngines) ||
						!arraysEqual(newCategories, oldCategories) ||
						newLang !== (originalConfig?.SEARXNG_LANGUAGE || "") ||
						newSafeSearch !== oldSafeSearch ||
						newVerifySSL !== oldVerifySSL
					) {
						newConfig.SEARXNG_HOST = newHost;
						newConfig.SEARXNG_API_KEY = newApiKey;
						newConfig.SEARXNG_ENGINES = newEngines;
						newConfig.SEARXNG_CATEGORIES = newCategories;
						newConfig.SEARXNG_LANGUAGE = newLang;
						if (newSafeSearch !== "") {
							const parsed = Number.parseInt(newSafeSearch, 10);
							newConfig.SEARXNG_SAFESEARCH = Number.isNaN(parsed) ? 0 : parsed;
						} else {
							newConfig.SEARXNG_SAFESEARCH = null;
						}
						if (newVerifySSL !== "") {
							const boolValue = normalizeBoolean(newVerifySSL);
							newConfig.SEARXNG_VERIFY_SSL = boolValue !== null ? boolValue : true;
						} else {
							newConfig.SEARXNG_VERIFY_SSL = null;
						}
						configChanged = true;
					}
				} else if (connectorType === "LINEAR_CONNECTOR") {
					const newKey = formValues.LINEAR_API_KEY?.trim() || "";
					if (newKey !== (originalConfig?.LINEAR_API_KEY || "")) {
						newConfig.LINEAR_API_KEY = newKey;
						configChanged = true;
					}
				} else if (connectorType === "LINKUP_API") {
					const newKey = formValues.LINKUP_API_KEY?.trim() || "";
					if (newKey !== (originalConfig?.LINKUP_API_KEY || "")) {
						newConfig.LINKUP_API_KEY = newKey;
						configChanged = true;
					}
				} else if (connectorType === "DISCORD_CONNECTOR") {
					const newToken = formValues.DISCORD_BOT_TOKEN?.trim() || "";
					if (newToken !== (originalConfig?.DISCORD_BOT_TOKEN || "")) {
						newConfig.DISCORD_BOT_TOKEN = newToken;
						configChanged = true;
					}
				} else if (connectorType === "CONFLUENCE_CONNECTOR") {
					const newBaseUrl = formValues.CONFLUENCE_BASE_URL?.trim() || "";
					const newEmail = formValues.CONFLUENCE_EMAIL?.trim() || "";
					const newToken = formValues.CONFLUENCE_API_TOKEN?.trim() || "";
					if (
						newBaseUrl !== (originalConfig?.CONFLUENCE_BASE_URL || "") ||
						newEmail !== (originalConfig?.CONFLUENCE_EMAIL || "") ||
						newToken !== (originalConfig?.CONFLUENCE_API_TOKEN || "")
					) {
						newConfig.CONFLUENCE_BASE_URL = newBaseUrl;
						newConfig.CONFLUENCE_EMAIL = newEmail;
						newConfig.CONFLUENCE_API_TOKEN = newToken;
						configChanged = true;
					}
				} else if (connectorType === "BOOKSTACK_CONNECTOR") {
					const newBaseUrl = formValues.BOOKSTACK_BASE_URL?.trim() || "";
					const newTokenId = formValues.BOOKSTACK_TOKEN_ID?.trim() || "";
					const newTokenSecret = formValues.BOOKSTACK_TOKEN_SECRET?.trim() || "";
					if (
						newBaseUrl !== (originalConfig?.BOOKSTACK_BASE_URL || "") ||
						newTokenId !== (originalConfig?.BOOKSTACK_TOKEN_ID || "") ||
						newTokenSecret !== (originalConfig?.BOOKSTACK_TOKEN_SECRET || "")
					) {
						newConfig.BOOKSTACK_BASE_URL = newBaseUrl;
						newConfig.BOOKSTACK_TOKEN_ID = newTokenId;
						newConfig.BOOKSTACK_TOKEN_SECRET = newTokenSecret;
						configChanged = true;
					}
				} else if (connectorType === "JIRA_CONNECTOR") {
					const newBaseUrl = formValues.JIRA_BASE_URL?.trim() || "";
					const newEmail = formValues.JIRA_EMAIL?.trim() || "";
					const newToken = formValues.JIRA_API_TOKEN?.trim() || "";
					if (
						newBaseUrl !== (originalConfig?.JIRA_BASE_URL || "") ||
						newEmail !== (originalConfig?.JIRA_EMAIL || "") ||
						newToken !== (originalConfig?.JIRA_API_TOKEN || "")
					) {
						newConfig.JIRA_BASE_URL = newBaseUrl;
						newConfig.JIRA_EMAIL = newEmail;
						newConfig.JIRA_API_TOKEN = newToken;
						configChanged = true;
					}
				} else if (connectorType === "LUMA_CONNECTOR") {
					const newKey = formValues.LUMA_API_KEY?.trim() || "";
					if (newKey !== (originalConfig?.LUMA_API_KEY || "")) {
						newConfig.LUMA_API_KEY = newKey;
						configChanged = true;
					}
				} else if (connectorType === "ELASTICSEARCH_CONNECTOR") {
					const newKey = formValues.ELASTICSEARCH_API_KEY?.trim() || "";
					if (newKey !== (originalConfig?.ELASTICSEARCH_API_KEY || "")) {
						newConfig.ELASTICSEARCH_API_KEY = newKey;
						configChanged = true;
					}
				} else if (connectorType === "WEBCRAWLER_CONNECTOR") {
					const newFirecrawlKey = formValues.FIRECRAWL_API_KEY?.trim() || "";
					const newUrls = formValues.INITIAL_URLS?.trim() || "";
					if (
						newFirecrawlKey !== (originalConfig?.FIRECRAWL_API_KEY || "") ||
						newUrls !== (originalConfig?.INITIAL_URLS || "")
					) {
						newConfig.FIRECRAWL_API_KEY = newFirecrawlKey;
						newConfig.INITIAL_URLS = newUrls;
						configChanged = true;
					}
				}
			}

			if (!nameChanged && !configChanged) {
				toast.info("No changes detected.");
				return;
			}

			setIsSaving(true);
			try {
				const updatePayload: any = { id: connectorId };
				if (nameChanged) {
					updatePayload.name = editForm.getValues().name.trim();
				}
				if (configChanged) {
					updatePayload.config = newConfig;
				}
				const response = await updateConnector(updatePayload);
				toast.success("Connector updated successfully!");
				const newlySavedConfig = response.config || {};
				if (nameChanged) {
					setConnector((prev) =>
						prev ? { ...prev, name: updatePayload.name!, config: newlySavedConfig } : null
					);
				}
				if (configChanged) {
					if (connector.connector_type === "GITHUB_CONNECTOR") {
						const savedGitHubConfig = newlySavedConfig as {
							GITHUB_PAT?: string;
							repo_full_names?: string[];
						};
						setCurrentSelectedRepos(savedGitHubConfig.repo_full_names || []);
						setOriginalPat(savedGitHubConfig.GITHUB_PAT || "");
						setNewSelectedRepos(savedGitHubConfig.repo_full_names || []);
						patForm.reset({ github_pat: savedGitHubConfig.GITHUB_PAT || "" });
					} else if (connector.connector_type === "SLACK_CONNECTOR") {
						editForm.setValue("SLACK_BOT_TOKEN", newlySavedConfig.SLACK_BOT_TOKEN || "");
					} else if (connector.connector_type === "NOTION_CONNECTOR") {
						editForm.setValue(
							"NOTION_INTEGRATION_TOKEN",
							newlySavedConfig.NOTION_INTEGRATION_TOKEN || ""
						);
					} else if (connector.connector_type === "TAVILY_API") {
						editForm.setValue("TAVILY_API_KEY", newlySavedConfig.TAVILY_API_KEY || "");
					} else if (connector.connector_type === "SEARXNG_API") {
						editForm.setValue("SEARXNG_HOST", newlySavedConfig.SEARXNG_HOST || "");
						editForm.setValue("SEARXNG_API_KEY", newlySavedConfig.SEARXNG_API_KEY || "");
						editForm.setValue(
							"SEARXNG_ENGINES",
							normalizeListInput(newlySavedConfig.SEARXNG_ENGINES).join(", ")
						);
						editForm.setValue(
							"SEARXNG_CATEGORIES",
							normalizeListInput(newlySavedConfig.SEARXNG_CATEGORIES).join(", ")
						);
						editForm.setValue("SEARXNG_LANGUAGE", newlySavedConfig.SEARXNG_LANGUAGE || "");
						editForm.setValue(
							"SEARXNG_SAFESEARCH",
							newlySavedConfig.SEARXNG_SAFESEARCH === null ||
								newlySavedConfig.SEARXNG_SAFESEARCH === undefined
								? ""
								: String(newlySavedConfig.SEARXNG_SAFESEARCH)
						);
						const verifyValue = normalizeBoolean(newlySavedConfig.SEARXNG_VERIFY_SSL);
						editForm.setValue(
							"SEARXNG_VERIFY_SSL",
							verifyValue === null ? "" : String(verifyValue)
						);
					} else if (connector.connector_type === "LINEAR_CONNECTOR") {
						editForm.setValue("LINEAR_API_KEY", newlySavedConfig.LINEAR_API_KEY || "");
					} else if (connector.connector_type === "LINKUP_API") {
						editForm.setValue("LINKUP_API_KEY", newlySavedConfig.LINKUP_API_KEY || "");
					} else if (connector.connector_type === "DISCORD_CONNECTOR") {
						editForm.setValue("DISCORD_BOT_TOKEN", newlySavedConfig.DISCORD_BOT_TOKEN || "");
					} else if (connector.connector_type === "CONFLUENCE_CONNECTOR") {
						editForm.setValue("CONFLUENCE_BASE_URL", newlySavedConfig.CONFLUENCE_BASE_URL || "");
						editForm.setValue("CONFLUENCE_EMAIL", newlySavedConfig.CONFLUENCE_EMAIL || "");
						editForm.setValue("CONFLUENCE_API_TOKEN", newlySavedConfig.CONFLUENCE_API_TOKEN || "");
					} else if (connector.connector_type === "BOOKSTACK_CONNECTOR") {
						editForm.setValue("BOOKSTACK_BASE_URL", newlySavedConfig.BOOKSTACK_BASE_URL || "");
						editForm.setValue("BOOKSTACK_TOKEN_ID", newlySavedConfig.BOOKSTACK_TOKEN_ID || "");
						editForm.setValue(
							"BOOKSTACK_TOKEN_SECRET",
							newlySavedConfig.BOOKSTACK_TOKEN_SECRET || ""
						);
					} else if (connector.connector_type === "JIRA_CONNECTOR") {
						editForm.setValue("JIRA_BASE_URL", newlySavedConfig.JIRA_BASE_URL || "");
						editForm.setValue("JIRA_EMAIL", newlySavedConfig.JIRA_EMAIL || "");
						editForm.setValue("JIRA_API_TOKEN", newlySavedConfig.JIRA_API_TOKEN || "");
					} else if (connector.connector_type === "LUMA_CONNECTOR") {
						editForm.setValue("LUMA_API_KEY", newlySavedConfig.LUMA_API_KEY || "");
					} else if (connector.connector_type === "ELASTICSEARCH_CONNECTOR") {
						editForm.setValue(
							"ELASTICSEARCH_API_KEY",
							newlySavedConfig.ELASTICSEARCH_API_KEY || ""
						);
					} else if (connector.connector_type === "WEBCRAWLER_CONNECTOR") {
						editForm.setValue("FIRECRAWL_API_KEY", newlySavedConfig.FIRECRAWL_API_KEY || "");
						editForm.setValue("INITIAL_URLS", newlySavedConfig.INITIAL_URLS || "");
					}
				}
				if (connector.connector_type === "GITHUB_CONNECTOR") {
					setEditMode("viewing");
					setFetchedRepos(null);
				}
			} catch (error) {
				console.error("Error updating connector:", error);
				toast.error(error instanceof Error ? error.message : "Failed to update connector.");
			} finally {
				setIsSaving(false);
			}
		},
		[
			connector,
			originalConfig,
			updateConnector,
			connectorId,
			patForm,
			originalPat,
			currentSelectedRepos,
			newSelectedRepos,
			editMode,
			fetchedRepos,
			editForm,
			setConnector,
			setOriginalPat,
			setCurrentSelectedRepos,
			setNewSelectedRepos,
			setEditMode,
			setFetchedRepos,
		]
	);

	return {
		isSaving,
		handleSaveChanges,
	};
}
