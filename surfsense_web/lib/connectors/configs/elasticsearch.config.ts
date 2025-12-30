import { z } from "zod";
import { type ConnectorConfig } from "../types";
import { EnumConnectorName } from "@/contracts/enums/connector";

// Define the form schema for Elasticsearch connector
const elasticsearchCredentialsSchema = z
	.object({
		name: z.string().min(3, {
			message: "Connector name must be at least 3 characters.",
		}),
		endpoint_url: z.string().url({ message: "Please enter a valid Elasticsearch endpoint URL." }),
		auth_method: z.enum(["basic", "api_key"]).default("api_key"),
		username: z.string().optional(),
		password: z.string().optional(),
		ELASTICSEARCH_API_KEY: z.string().optional(),
		indices: z.string().optional(),
		query: z.string().default("*"),
		search_fields: z.string().optional(),
		max_documents: z.coerce.number().min(1).max(10000).optional(),
	})
	.refine(
		(data) => {
			if (data.auth_method === "basic") {
				return Boolean(data.username?.trim() && data.password?.trim());
			}
			if (data.auth_method === "api_key") {
				return Boolean(data.ELASTICSEARCH_API_KEY?.trim());
			}
			return true;
		},
		{
			message: "Authentication credentials are required for the selected method.",
			path: ["auth_method"],
		}
	);

export const elasticsearchConnectorConfig: ConnectorConfig = {
	type: EnumConnectorName.ELASTICSEARCH_CONNECTOR,
	name: "Elasticsearch",
	defaultName: "Elasticsearch Connector",
	description: "Connect to your Elasticsearch cluster to index and search documents.",
	credentialsSchema: elasticsearchCredentialsSchema,
	fields: [
		{
			name: "name",
			label: "Connector Name",
			type: "text",
			placeholder: "Elasticsearch Connector",
			description: "A friendly name for this connector",
			required: true,
		},
		{
			name: "endpoint_url",
			label: "Elasticsearch Endpoint URL",
			type: "url",
			placeholder: "https://elasticsearch.example.com:9200",
			description: "The full URL of your Elasticsearch cluster",
			required: true,
		},
		{
			name: "auth_method",
			label: "Authentication Method",
			type: "radio",
			options: [
				{ value: "api_key", label: "API Key" },
				{ value: "basic", label: "Basic Auth (Username/Password)" },
			],
			description: "Choose how to authenticate with Elasticsearch",
			required: true,
		},
		{
			name: "ELASTICSEARCH_API_KEY",
			label: "API Key",
			type: "password",
			placeholder: "Your Elasticsearch API Key",
			description: "Elasticsearch API key for authentication",
			required: false,
			showWhen: (values) => values.auth_method === "api_key",
		},
		{
			name: "username",
			label: "Username",
			type: "text",
			placeholder: "elastic",
			description: "Elasticsearch username",
			required: false,
			showWhen: (values) => values.auth_method === "basic",
		},
		{
			name: "password",
			label: "Password",
			type: "password",
			placeholder: "Your password",
			description: "Elasticsearch password",
			required: false,
			showWhen: (values) => values.auth_method === "basic",
		},
		{
			name: "indices",
			label: "Indices (optional)",
			type: "text",
			placeholder: "index1, index2, index3 or * for all",
			description: "Comma-separated list of indices to search. Leave empty or use * for all indices.",
			required: false,
		},
		{
			name: "query",
			label: "Query Filter (optional)",
			type: "text",
			placeholder: "*",
			description: "Elasticsearch query to filter documents. Default is * (all documents).",
			required: false,
		},
		{
			name: "search_fields",
			label: "Search Fields (optional)",
			type: "text",
			placeholder: "title, content, description",
			description: "Comma-separated list of fields to search in.",
			required: false,
		},
		{
			name: "max_documents",
			label: "Maximum Documents (optional)",
			type: "number",
			placeholder: "1000",
			description: "Maximum number of documents to index (1-10000).",
			required: false,
		},
	],
	transformToConfig: (credentials) => {
		const stringToArray = (str: string): string[] => {
			const items = str
				.split(",")
				.map((item) => item.trim())
				.filter((item) => item.length > 0);
			return Array.from(new Set(items));
		};

		const config: Record<string, string | number | boolean | string[]> = {
			ELASTICSEARCH_URL: credentials.endpoint_url,
			ELASTICSEARCH_VERIFY_CERTS: true,
		};

		if (credentials.auth_method === "basic") {
			if (credentials.username) config.ELASTICSEARCH_USERNAME = credentials.username;
			if (credentials.password) config.ELASTICSEARCH_PASSWORD = credentials.password;
		} else if (credentials.auth_method === "api_key") {
			if (credentials.ELASTICSEARCH_API_KEY) {
				config.ELASTICSEARCH_API_KEY = credentials.ELASTICSEARCH_API_KEY;
			}
		}

		const indicesInput = credentials.indices?.trim() ?? "";
		const indicesArr = stringToArray(indicesInput);
		config.ELASTICSEARCH_INDEX =
			indicesArr.length === 0 ? "*" : indicesArr.length === 1 ? indicesArr[0] : indicesArr;

		if (credentials.query && credentials.query !== "*") {
			config.ELASTICSEARCH_QUERY = credentials.query;
		}

		if (credentials.search_fields?.trim()) {
			const fields = stringToArray(credentials.search_fields);
			config.ELASTICSEARCH_FIELDS = fields;
			config.ELASTICSEARCH_CONTENT_FIELDS = fields;
			if (fields.includes("title")) {
				config.ELASTICSEARCH_TITLE_FIELD = "title";
			}
		}

		if (credentials.max_documents !== undefined && credentials.max_documents > 0) {
			config.ELASTICSEARCH_MAX_DOCUMENTS = credentials.max_documents;
		}

		return config;
	},
	documentationUrl: "https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api-create-api-key.html",
	documentationSteps: [
		"Access your Elasticsearch cluster's Kibana interface",
		"Navigate to Stack Management > Security > API Keys",
		"Click 'Create API Key'",
		"Give it a name and appropriate privileges for the indices you want to search",
		"Copy the generated API key and paste it above",
	],
};
