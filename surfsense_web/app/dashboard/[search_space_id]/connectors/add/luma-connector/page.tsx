"use client";

import { useParams } from "next/navigation";
import { ConnectorWizard } from "@/components/connectors/ConnectorWizard";
import { lumaConnectorConfig } from "@/lib/connectors/configs/luma.config";

export default function LumaConnectorPage() {
	const params = useParams();
	const searchSpaceId = params.search_space_id as string;
	
	return <ConnectorWizard config={lumaConnectorConfig} searchSpaceId={searchSpaceId} />;
}
