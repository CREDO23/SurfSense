"use client";

import { useParams } from "next/navigation";
import { ConnectorWizard } from "@/components/connectors/ConnectorWizard";
import { jiraConnectorConfig } from "@/lib/connectors/configs/jira.config";

export default function JiraConnectorPage() {
	const params = useParams();
	const searchSpaceId = params.search_space_id as string;
	
	return <ConnectorWizard config={jiraConnectorConfig} searchSpaceId={searchSpaceId} />;
}
