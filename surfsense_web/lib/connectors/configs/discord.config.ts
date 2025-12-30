import * as z from "zod";
import { EnumConnectorName } from "@/contracts/enums/connector";
import type { ConnectorConfig } from "@/lib/connectors/types";

const discordSchema = z.object({
	name: z.string().min(3, "Connector name must be at least 3 characters"),
	bot_token: z.string().min(10, "Bot token is required"),
});

export const discordConnectorConfig: ConnectorConfig<typeof discordSchema> = {
	connectorType: EnumConnectorName.DISCORD_CONNECTOR,
	name: "Discord",
	displayName: "Discord Connector",
	description: "Connect to Discord to index your server messages",
	schema: discordSchema,
	defaultValues: { name: "Discord Connector", bot_token: "" },
	fields: [
		{ name: "name", label: "Connector Name", type: "text", placeholder: "My Discord Server", required: true },
		{ name: "bot_token", label: "Bot Token", type: "password", placeholder: "Your Discord bot token", required: true },
	],
	transformToConfig: (values) => ({ DISCORD_BOT_TOKEN: values.bot_token }),
};
