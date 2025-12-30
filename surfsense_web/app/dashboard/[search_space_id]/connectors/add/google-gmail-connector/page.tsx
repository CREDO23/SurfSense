"use client";

import { useParams } from "next/navigation";
import { ConnectorWizard } from "@/components/connectors/ConnectorWizard";
import { gmailConnectorConfig } from "@/lib/connectors/configs/google-gmail.config";

export default function GoogleGmailConnectorPage() {
	const params = useParams();
	const searchSpaceId = params.search_space_id as string;
	
	return <ConnectorWizard config={gmailConnectorConfig} searchSpaceId={searchSpaceId} />;
}
