"use client";

import { useParams } from "next/navigation";
import { ConnectorWizard } from "@/components/connectors/ConnectorWizard";
import { githubConnectorConfig } from "@/lib/connectors/configs/github.config";

export default function GithubConnectorPage() {
	const params = useParams();
	const searchSpaceId = params.search_space_id as string;
	
	return <ConnectorWizard config={githubConnectorConfig} searchSpaceId={searchSpaceId} />;
}
