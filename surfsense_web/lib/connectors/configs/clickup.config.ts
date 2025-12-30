import * as z from "zod";
import { EnumConnectorName } from "@/contracts/enums/connector";
import type { ConnectorConfig } from "@/lib/connectors/types";
const clickupSchema = z.object({ name: z.string().min(3), api_key: z.string().min(10) });
export const clickupConnectorConfig: ConnectorConfig<typeof clickupSchema> = {
	connectorType: EnumConnectorName.CLICKUP_CONNECTOR, name: "ClickUp", displayName: "ClickUp Connector",
	description: "Connect to ClickUp", schema: clickupSchema, defaultValues: { name: "ClickUp Connector", api_key: "" },
	fields: [
		{ name: "name", label: "Connector Name", type: "text", placeholder: "ClickUp", required: true },
		{ name: "api_key", label: "API Key", type: "password", placeholder: "API key", required: true },
	], transformToConfig: (values) => ({ CLICKUP_API_KEY: values.api_key }),
};
