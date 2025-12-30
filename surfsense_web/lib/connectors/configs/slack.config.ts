import * as z from "zod";
import { EnumConnectorName } from "@/contracts/enums/connector";
import type { ConnectorConfig } from "@/lib/connectors/types";

const slackSchema = z.object({
	name: z.string().min(3, "Connector name must be at least 3 characters"),
	bot_token: z.string().min(10, "Bot User OAuth Token is required and must be valid"),
});

export const slackConnectorConfig: ConnectorConfig<typeof slackSchema> = {
	connectorType: EnumConnectorName.SLACK_CONNECTOR,
	name: "Slack",
	displayName: "Slack Connector",
	description: "Connect to Slack to index channels and messages",
	
	schema: slackSchema,
	defaultValues: {
		name: "Slack Connector",
		bot_token: "",
	},
	
	fields: [
		{
			name: "name",
			label: "Connector Name",
			type: "text",
			placeholder: "My Slack Workspace",
			description: "A friendly name to identify this connector",
			required: true,
		},
		{
			name: "bot_token",
			label: "Bot User OAuth Token",
			type: "password",
			placeholder: "xoxb-...",
			description: "Your Slack Bot User OAuth Token",
			required: true,
		},
	],
	
	transformToConfig: (values) => ({
		SLACK_BOT_TOKEN: values.bot_token,
	}),
	
	setupInstructions: [
		{
			title: "Create a Slack App",
			steps: [
				"Go to https://api.slack.com/apps",
				"Click 'Create New App'",
				"Choose 'From scratch' and give your app a name",
			],
		},
		{
			title: "Configure Bot Permissions",
			steps: [
				"Go to 'OAuth & Permissions'",
				"Add Bot Token Scopes: channels:history, channels:read, users:read",
				"Install the app to your workspace",
				"Copy the 'Bot User OAuth Token'",
			],
		},
	],
};
