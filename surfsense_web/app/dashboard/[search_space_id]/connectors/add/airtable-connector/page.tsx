"use client";

import { useParams } from "next/navigation";
import { ConnectorWizard } from "@/components/connectors/ConnectorWizard";
import { airtableConnectorConfig } from "@/lib/connectors/configs/airtable.config";

export default function AirtableConnectorPage() {
	const params = useParams();
	const searchSpaceId = params.search_space_id as string;
	
	return <ConnectorWizard config={airtableConnectorConfig} searchSpaceId={searchSpaceId} />;
}
