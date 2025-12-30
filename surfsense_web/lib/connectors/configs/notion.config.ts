import * as z from "zod";
import { EnumConnectorName } from "@/contracts/enums/connector";
import type { ConnectorConfig } from "@/lib/connectors/types";

const notionSchema = z.object({
	name: z.string().min(3, "Connector name must be at least 3 characters"),
	integration_token: z.string().min(10, "Integration token is required"),
});

export const notionConnectorConfig: ConnectorConfig<typeof notionSchema> = {
	connectorType: EnumConnectorName.NOTION_CONNECTOR,
	name: "Notion",
	displayName: "Notion Connector",
	description: "Connect to Notion to index your workspace pages",
	
	schema: notionSchema,
	defaultValues: {
		name: "Notion Connector",
		integration_token: "",
	},
	
	fields: [
		{
			name: "name",
			label: "Connector Name",
			type: "text",
			placeholder: "My Notion Workspace",
			description: "A friendly name to identify this connector",
			required: true,
		},
		{
			name: "integration_token",
			label: "Integration Token",
			type: "password",
			placeholder: "secret_...",
			description: "Your Notion integration token",
			required: true,
		},
	],
	
	transformToConfig: (values) => ({
		NOTION_INTEGRATION_TOKEN: values.integration_token,
	}),
};
