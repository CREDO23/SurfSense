"use client";

import { useParams } from "next/navigation";
import { ConnectorWizard } from "@/components/connectors/ConnectorWizard";
import { elasticsearchConnectorConfig } from "@/lib/connectors/configs/elasticsearch.config";

export default function ElasticsearchConnectorPage() {
	const params = useParams();
	const searchSpaceId = params.search_space_id as string;
	
	return <ConnectorWizard config={elasticsearchConnectorConfig} searchSpaceId={searchSpaceId} />;
}
