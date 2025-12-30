import * as z from "zod";
import { EnumConnectorName } from "@/contracts/enums/connector";
import type { ConnectorConfig } from "@/lib/connectors/types";
const airtableSchema = z.object({ name: z.string().min(3), access_token: z.string().min(10) });
export const airtableConnectorConfig: ConnectorConfig<typeof airtableSchema> = {
	connectorType: EnumConnectorName.AIRTABLE_CONNECTOR, name: "Airtable", displayName: "Airtable Connector",
	description: "Connect to Airtable", schema: airtableSchema, defaultValues: { name: "Airtable Connector", access_token: "" },
	fields: [
		{ name: "name", label: "Connector Name", type: "text", placeholder: "Airtable", required: true },
		{ name: "access_token", label: "Access Token", type: "password", placeholder: "Token", required: true },
	], transformToConfig: (values) => ({ AIRTABLE_ACCESS_TOKEN: values.access_token }),
};
