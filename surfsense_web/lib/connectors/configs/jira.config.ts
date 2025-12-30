import * as z from "zod";
import { EnumConnectorName } from "@/contracts/enums/connector";
import type { ConnectorConfig } from "@/lib/connectors/types";

const jiraSchema = z.object({
	name: z.string().min(3, "Connector name must be at least 3 characters"),
	api_token: z.string().min(10, "API token is required"),
	domain: z.string().url("Must be a valid URL"),
	email: z.string().email("Must be a valid email"),
});

export const jiraConnectorConfig: ConnectorConfig<typeof jiraSchema> = {
	connectorType: EnumConnectorName.JIRA_CONNECTOR,
	name: "Jira",
	displayName: "Jira Connector",
	description: "Connect to Jira to index your issues and projects",
	
	schema: jiraSchema,
	defaultValues: {
		name: "Jira Connector",
		api_token: "",
		domain: "https://your-domain.atlassian.net",
		email: "",
	},
	
	fields: [
		{
			name: "name",
			label: "Connector Name",
			type: "text",
			placeholder: "My Jira Instance",
			required: true,
		},
		{
			name: "domain",
			label: "Jira Domain",
			type: "url",
			placeholder: "https://your-domain.atlassian.net",
			required: true,
		},
		{
			name: "email",
			label: "Email",
			type: "email",
			placeholder: "your-email@company.com",
			required: true,
		},
		{
			name: "api_token",
			label: "API Token",
			type: "password",
			placeholder: "Your Jira API token",
			required: true,
		},
	],
	
	transformToConfig: (values) => ({
		JIRA_API_TOKEN: values.api_token,
		JIRA_DOMAIN: values.domain,
		JIRA_USER_EMAIL: values.email,
	}),
};
