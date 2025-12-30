"use client";

import { useParams } from "next/navigation";
import { ConnectorWizard } from "@/components/connectors/ConnectorWizard";
import { notionConnectorConfig } from "@/lib/connectors/configs/notion.config";

export default function NotionConnectorPage() {
	const params = useParams();
	const searchSpaceId = params.search_space_id as string;
	
	return <ConnectorWizard config={notionConnectorConfig} searchSpaceId={searchSpaceId} />;
}
