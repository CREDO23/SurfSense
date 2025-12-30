"use client";

import { useParams } from "next/navigation";
import { ConnectorWizard } from "@/components/connectors/ConnectorWizard";
import { confluenceConnectorConfig } from "@/lib/connectors/configs/confluence.config";

export default function ConfluenceConnectorPage() {
	const params = useParams();
	const searchSpaceId = params.search_space_id as string;
	
	return <ConnectorWizard config={confluenceConnectorConfig} searchSpaceId={searchSpaceId} />;
}
