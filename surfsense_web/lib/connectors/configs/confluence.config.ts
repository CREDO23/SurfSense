import * as z from "zod";
import { EnumConnectorName } from "@/contracts/enums/connector";
import type { ConnectorConfig } from "@/lib/connectors/types";

const confluenceSchema = z.object({
	name: z.string().min(3, "Connector name must be at least 3 characters"),
	api_token: z.string().min(10, "API token is required"),
	domain: z.string().url("Must be a valid URL"),
	email: z.string().email("Must be a valid email"),
});

export const confluenceConnectorConfig: ConnectorConfig<typeof confluenceSchema> = {
	connectorType: EnumConnectorName.CONFLUENCE_CONNECTOR,
	name: "Confluence",
	displayName: "Confluence Connector",
	description: "Connect to Confluence to index your knowledge base",
	schema: confluenceSchema,
	defaultValues: { name: "Confluence Connector", api_token: "", domain: "https://your-domain.atlassian.net", email: "" },
	fields: [
		{ name: "name", label: "Connector Name", type: "text", placeholder: "My Confluence", required: true },
		{ name: "domain", label: "Domain", type: "url", placeholder: "https://your-domain.atlassian.net", required: true },
		{ name: "email", label: "Email", type: "email", placeholder: "email@company.com", required: true },
		{ name: "api_token", label: "API Token", type: "password", placeholder: "API token", required: true },
	],
	transformToConfig: (values) => ({ CONFLUENCE_API_TOKEN: values.api_token, CONFLUENCE_DOMAIN: values.domain, CONFLUENCE_USER_EMAIL: values.email }),
};
