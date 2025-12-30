"use client";

import { useParams } from "next/navigation";
import { ConnectorWizard } from "@/components/connectors/ConnectorWizard";
import { linearConnectorConfig } from "@/lib/connectors/configs/linear.config";

export default function LinearConnectorPage() {
	const params = useParams();
	const searchSpaceId = params.search_space_id as string;
	
	return <ConnectorWizard config={linearConnectorConfig} searchSpaceId={searchSpaceId} />;
}
