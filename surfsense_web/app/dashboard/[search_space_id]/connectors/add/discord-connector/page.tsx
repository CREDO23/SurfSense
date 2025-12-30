"use client";

import { useParams } from "next/navigation";
import { ConnectorWizard } from "@/components/connectors/ConnectorWizard";
import { discordConnectorConfig } from "@/lib/connectors/configs/discord.config";

export default function DiscordConnectorPage() {
	const params = useParams();
	const searchSpaceId = params.search_space_id as string;
	
	return <ConnectorWizard config={discordConnectorConfig} searchSpaceId={searchSpaceId} />;
}
