import * as z from "zod";
import { EnumConnectorName } from "@/contracts/enums/connector";
import type { ConnectorConfig } from "@/lib/connectors/types";
const lumaSchema = z.object({ name: z.string().min(3), api_key: z.string().min(10) });
export const lumaConnectorConfig: ConnectorConfig<typeof lumaSchema> = {
	connectorType: EnumConnectorName.LUMA_CONNECTOR, name: "Luma", displayName: "Luma Connector",
	description: "Connect to Luma", schema: lumaSchema, defaultValues: { name: "Luma Connector", api_key: "" },
	fields: [
		{ name: "name", label: "Connector Name", type: "text", placeholder: "Luma", required: true },
		{ name: "api_key", label: "API Key", type: "password", placeholder: "API key", required: true },
	], transformToConfig: (values) => ({ LUMA_API_KEY: values.api_key }),
};
