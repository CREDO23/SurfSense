"use client";

import { useParams } from "next/navigation";
import { ConnectorWizard } from "@/components/connectors/ConnectorWizard";
import { calendarConnectorConfig } from "@/lib/connectors/configs/google-calendar.config";

export default function GoogleCalendarConnectorPage() {
	const params = useParams();
	const searchSpaceId = params.search_space_id as string;
	
	return <ConnectorWizard config={calendarConnectorConfig} searchSpaceId={searchSpaceId} />;
}
