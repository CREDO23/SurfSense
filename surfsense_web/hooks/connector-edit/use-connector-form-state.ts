import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import {
	type EditConnectorFormValues,
	editConnectorSchema,
	type GithubPatFormValues,
	githubPatSchema,
} from "@/components/editConnector/types";
import type { SearchSourceConnector } from "@/hooks/use-search-source-connectors";
import { normalizeBoolean, normalizeListInput } from "@/lib/connector-utils";

export interface FormStateReturn {
	editForm: UseFormReturn<EditConnectorFormValues>;
	patForm: UseFormReturn<GithubPatFormValues>;
	connector: SearchSourceConnector | null;
	setConnector: (connector: SearchSourceConnector | null) => void;
	originalConfig: Record<string, any> | null;
	setOriginalConfig: (config: Record<string, any> | null) => void;
}

export function useConnectorFormState(
	connectorId: number,
	connectors: SearchSourceConnector[],
	connectorsLoading: boolean
): FormStateReturn {
	const [connector, setConnector] = useState<SearchSourceConnector | null>(null);
	const [originalConfig, setOriginalConfig] = useState<Record<string, any> | null>(null);

	const patForm = useForm<GithubPatFormValues>({
		resolver: zodResolver(githubPatSchema),
		defaultValues: { github_pat: "" },
	});

	const editForm = useForm<EditConnectorFormValues>({
		resolver: zodResolver(editConnectorSchema),
		defaultValues: {
			name: "",
			SLACK_BOT_TOKEN: "",
			NOTION_INTEGRATION_TOKEN: "",
			TAVILY_API_KEY: "",
			SEARXNG_HOST: "",
			SEARXNG_API_KEY: "",
			SEARXNG_ENGINES: "",
			SEARXNG_CATEGORIES: "",
			SEARXNG_LANGUAGE: "",
			SEARXNG_SAFESEARCH: "",
			SEARXNG_VERIFY_SSL: "",
			LINEAR_API_KEY: "",
			DISCORD_BOT_TOKEN: "",
			CONFLUENCE_BASE_URL: "",
			CONFLUENCE_EMAIL: "",
			CONFLUENCE_API_TOKEN: "",
			BOOKSTACK_BASE_URL: "",
			BOOKSTACK_TOKEN_ID: "",
			BOOKSTACK_TOKEN_SECRET: "",
			JIRA_BASE_URL: "",
			JIRA_EMAIL: "",
			JIRA_API_TOKEN: "",
			LUMA_API_KEY: "",
			ELASTICSEARCH_API_KEY: "",
			FIRECRAWL_API_KEY: "",
			INITIAL_URLS: "",
		},
	});

	useEffect(() => {
		if (!connectorsLoading && connectors.length > 0 && !connector) {
			const currentConnector = connectors.find((c) => c.id === connectorId);
			if (currentConnector) {
				setConnector(currentConnector);
				const config = currentConnector.config || {};
				setOriginalConfig(config);
				editForm.reset({
					name: currentConnector.name,
					SLACK_BOT_TOKEN: config.SLACK_BOT_TOKEN || "",
					NOTION_INTEGRATION_TOKEN: config.NOTION_INTEGRATION_TOKEN || "",
					TAVILY_API_KEY: config.TAVILY_API_KEY || "",
					SEARXNG_HOST: config.SEARXNG_HOST || "",
					SEARXNG_API_KEY: config.SEARXNG_API_KEY || "",
					SEARXNG_ENGINES: Array.isArray(config.SEARXNG_ENGINES)
						? config.SEARXNG_ENGINES.join(", ")
						: config.SEARXNG_ENGINES || "",
					SEARXNG_CATEGORIES: Array.isArray(config.SEARXNG_CATEGORIES)
						? config.SEARXNG_CATEGORIES.join(", ")
						: config.SEARXNG_CATEGORIES || "",
					SEARXNG_LANGUAGE: config.SEARXNG_LANGUAGE || "",
					SEARXNG_SAFESEARCH:
						config.SEARXNG_SAFESEARCH === null || config.SEARXNG_SAFESEARCH === undefined
							? ""
							: String(config.SEARXNG_SAFESEARCH),
					SEARXNG_VERIFY_SSL: (() => {
						const value = normalizeBoolean(config.SEARXNG_VERIFY_SSL);
						return value === null ? "" : String(value);
					})(),
					LINEAR_API_KEY: config.LINEAR_API_KEY || "",
					DISCORD_BOT_TOKEN: config.DISCORD_BOT_TOKEN || "",
					CONFLUENCE_BASE_URL: config.CONFLUENCE_BASE_URL || "",
					CONFLUENCE_EMAIL: config.CONFLUENCE_EMAIL || "",
					CONFLUENCE_API_TOKEN: config.CONFLUENCE_API_TOKEN || "",
					BOOKSTACK_BASE_URL: config.BOOKSTACK_BASE_URL || "",
					BOOKSTACK_TOKEN_ID: config.BOOKSTACK_TOKEN_ID || "",
					BOOKSTACK_TOKEN_SECRET: config.BOOKSTACK_TOKEN_SECRET || "",
					JIRA_BASE_URL: config.JIRA_BASE_URL || "",
					JIRA_EMAIL: config.JIRA_EMAIL || "",
					JIRA_API_TOKEN: config.JIRA_API_TOKEN || "",
					LUMA_API_KEY: config.LUMA_API_KEY || "",
					ELASTICSEARCH_API_KEY: config.ELASTICSEARCH_API_KEY || "",
					FIRECRAWL_API_KEY: config.FIRECRAWL_API_KEY || "",
					INITIAL_URLS: config.INITIAL_URLS || "",
				});
			}
		}
	}, [connectorId, connectors, connectorsLoading, connector, editForm]);

	return {
		editForm,
		patForm,
		connector,
		setConnector,
		originalConfig,
		setOriginalConfig,
	};
}
