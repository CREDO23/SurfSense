"use client";

import { useParams } from "next/navigation";
import { ConnectorWizard } from "@/components/connectors/ConnectorWizard";
import { bookstackConnectorConfig } from "@/lib/connectors/configs/bookstack.config";

export default function BookStackConnectorPage() {
	const params = useParams();
	const searchSpaceId = params.search_space_id as string;
	
	return <ConnectorWizard config={bookstackConnectorConfig} searchSpaceId={searchSpaceId} />;
}
