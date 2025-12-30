import { z } from "zod";
import { type ConnectorConfig } from "../types";
import { EnumConnectorName } from "@/contracts/enums/connector";

// Define the form schema for GitHub PAT entry
const githubCredentialsSchema = z.object({
	name: z.string().min(3, {
		message: "Connector name must be at least 3 characters.",
	}),
	github_pat: z
		.string()
		.min(20, {
			message: "GitHub Personal Access Token seems too short.",
		})
		.refine((pat) => pat.startsWith("ghp_") || pat.startsWith("github_pat_"), {
			message: "GitHub PAT should start with 'ghp_' or 'github_pat_'",
		}),
});

// Type for fetched GitHub repositories
interface GithubRepo {
	id: number;
	name: string;
	full_name: string;
	private: boolean;
	url: string;
	description: string | null;
	last_updated: string | null;
}

export const githubConnectorConfig: ConnectorConfig = {
	type: EnumConnectorName.GITHUB_CONNECTOR,
	name: "GitHub",
	defaultName: "GitHub Connector",
	description: "Connect your GitHub repositories to enable search across code, issues, and documentation.",
	credentialsSchema: githubCredentialsSchema,
	fields: [
		{
			name: "name",
			label: "Connector Name",
			type: "text",
			placeholder: "GitHub Connector",
			description: "A friendly name for this connector",
			required: true,
		},
		{
			name: "github_pat",
			label: "GitHub Personal Access Token (PAT)",
			type: "password",
			placeholder: "ghp_...",
			description: "Your GitHub PAT with 'repo' scope. Create one at GitHub Developer Settings.",
			required: true,
		},
	],
	resourceSelection: {
		enabled: true,
		label: "Select Repositories",
		description: "Choose which repositories you want SurfSense to index for search.",
		fetchEndpoint: "/api/v1/github/repositories",
		fetchMethod: "POST",
		fetchPayload: (credentials) => ({
			github_pat: credentials.github_pat,
		}),
		getDisplayName: (repo: GithubRepo) => repo.full_name,
		getId: (repo: GithubRepo) => repo.full_name,
		getDescription: (repo: GithubRepo) => repo.description || "No description",
		getMetadata: (repo: GithubRepo) => ({
			isPrivate: repo.private,
			lastUpdated: repo.last_updated,
		}),
		minimumRequired: 1,
	},
	transformToConfig: (credentials, selectedResources) => ({
		GITHUB_PAT: credentials.github_pat,
		...(selectedResources && { repo_full_names: selectedResources }),
	}),
	documentationUrl: "https://github.com/settings/personal-access-tokens",
	documentationSteps: [
		"Go to GitHub Settings > Developer Settings > Personal Access Tokens",
		"Click 'Generate new token (classic)' or create a fine-grained token",
		"Select the 'repo' scope for full repository access",
		"Copy the generated token and paste it above",
		"The token should start with 'ghp_' or 'github_pat_'",
	],
};
