"use client";

import { useParams } from "next/navigation";
import { ConnectorWizard } from "@/components/connectors/ConnectorWizard";
import { webcrawlerConnectorConfig } from "@/lib/connectors/configs/webcrawler.config";

export default function WebCrawlerConnectorPage() {
	const params = useParams();
	const searchSpaceId = params.search_space_id as string;
	
	return <ConnectorWizard config={webcrawlerConnectorConfig} searchSpaceId={searchSpaceId} />;
}
