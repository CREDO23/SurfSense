import * as z from "zod";
import { EnumConnectorName } from "@/contracts/enums/connector";
import type { ConnectorConfig } from "@/lib/connectors/types";
const calendarSchema = z.object({ name: z.string().min(3), credentials: z.string().min(10) });
export const calendarConnectorConfig: ConnectorConfig<typeof calendarSchema> = {
	connectorType: EnumConnectorName.GOOGLE_CALENDAR_CONNECTOR, name: "Calendar", displayName: "Google Calendar",
	description: "Connect to Google Calendar", schema: calendarSchema, defaultValues: { name: "Calendar", credentials: "" },
	fields: [
		{ name: "name", label: "Connector Name", type: "text", placeholder: "Calendar", required: true },
		{ name: "credentials", label: "Credentials JSON", type: "password", placeholder: "Credentials", required: true },
	], transformToConfig: (values) => ({ GOOGLE_CALENDAR_CREDENTIALS: values.credentials }),
};
