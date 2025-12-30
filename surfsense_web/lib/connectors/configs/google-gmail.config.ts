import * as z from "zod";
import { EnumConnectorName } from "@/contracts/enums/connector";
import type { ConnectorConfig } from "@/lib/connectors/types";
const gmailSchema = z.object({ name: z.string().min(3), credentials: z.string().min(10) });
export const gmailConnectorConfig: ConnectorConfig<typeof gmailSchema> = {
	connectorType: EnumConnectorName.GOOGLE_GMAIL_CONNECTOR, name: "Gmail", displayName: "Gmail Connector",
	description: "Connect to Gmail", schema: gmailSchema, defaultValues: { name: "Gmail", credentials: "" },
	fields: [
		{ name: "name", label: "Connector Name", type: "text", placeholder: "Gmail", required: true },
		{ name: "credentials", label: "Credentials JSON", type: "password", placeholder: "Credentials", required: true },
	], transformToConfig: (values) => ({ GOOGLE_GMAIL_CREDENTIALS: values.credentials }),
};
