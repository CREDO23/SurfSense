"use client";

import { useParams } from "next/navigation";
import { ConnectorWizard } from "@/components/connectors/ConnectorWizard";
import { slackConnectorConfig } from "@/lib/connectors/configs/slack.config";

export default function SlackConnectorPage() {
	const params = useParams();
	const searchSpaceId = params.search_space_id as string;
	
	return <ConnectorWizard config={slackConnectorConfig} searchSpaceId={searchSpaceId} />;
}
