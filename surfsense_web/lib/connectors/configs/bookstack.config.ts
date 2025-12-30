import * as z from "zod";
import { EnumConnectorName } from "@/contracts/enums/connector";
import type { ConnectorConfig } from "@/lib/connectors/types";
const bookstackSchema = z.object({ name: z.string().min(3), api_token: z.string().min(10), base_url: z.string().url() });
export const bookstackConnectorConfig: ConnectorConfig<typeof bookstackSchema> = {
	connectorType: EnumConnectorName.BOOKSTACK_CONNECTOR, name: "BookStack", displayName: "BookStack Connector",
	description: "Connect to BookStack", schema: bookstackSchema, defaultValues: { name: "BookStack", api_token: "", base_url: "" },
	fields: [
		{ name: "name", label: "Connector Name", type: "text", placeholder: "BookStack", required: true },
		{ name: "base_url", label: "Base URL", type: "url", placeholder: "https://bookstack.example.com", required: true },
		{ name: "api_token", label: "API Token", type: "password", placeholder: "Token", required: true },
	], transformToConfig: (values) => ({ BOOKSTACK_API_TOKEN: values.api_token, BOOKSTACK_BASE_URL: values.base_url }),
};
