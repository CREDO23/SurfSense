import * as z from "zod";
import { EnumConnectorName } from "@/contracts/enums/connector";
import type { ConnectorConfig } from "@/lib/connectors/types";

const linearSchema = z.object({
	name: z.string().min(3, "Connector name must be at least 3 characters"),
	api_key: z.string().min(10, "API key is required"),
});

export const linearConnectorConfig: ConnectorConfig<typeof linearSchema> = {
	connectorType: EnumConnectorName.LINEAR_CONNECTOR,
	name: "Linear",
	displayName: "Linear Connector",
	description: "Connect to Linear to index your issues and projects",
	
	schema: linearSchema,
	defaultValues: {
		name: "Linear Connector",
		api_key: "",
	},
	
	fields: [
		{
			name: "name",
			label: "Connector Name",
			type: "text",
			placeholder: "My Linear Workspace",
			description: "A friendly name to identify this connector",
			required: true,
		},
		{
			name: "api_key",
			label: "API Key",
			type: "password",
			placeholder: "lin_api_...",
			description: "Your Linear API key",
			required: true,
		},
	],
	
	transformToConfig: (values) => ({
		LINEAR_API_KEY: values.api_key,
	}),
};
