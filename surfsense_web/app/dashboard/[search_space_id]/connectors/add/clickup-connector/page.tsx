"use client";

import { useParams } from "next/navigation";
import { ConnectorWizard } from "@/components/connectors/ConnectorWizard";
import { clickupConnectorConfig } from "@/lib/connectors/configs/clickup.config";

export default function ClickUpConnectorPage() {
	const params = useParams();
	const searchSpaceId = params.search_space_id as string;
	
	return <ConnectorWizard config={clickupConnectorConfig} searchSpaceId={searchSpaceId} />;
}
