import * as z from "zod";
import { EnumConnectorName } from "@/contracts/enums/connector";
import type { ConnectorConfig } from "@/lib/connectors/types";
const webcrawlerSchema = z.object({ name: z.string().min(3), url: z.string().url() });
export const webcrawlerConnectorConfig: ConnectorConfig<typeof webcrawlerSchema> = {
	connectorType: EnumConnectorName.WEBCRAWLER_CONNECTOR, name: "WebCrawler", displayName: "Web Crawler",
	description: "Crawl websites", schema: webcrawlerSchema, defaultValues: { name: "Web Crawler", url: "" },
	fields: [
		{ name: "name", label: "Connector Name", type: "text", placeholder: "My Website", required: true },
		{ name: "url", label: "URL", type: "url", placeholder: "https://example.com", required: true },
	], transformToConfig: (values) => ({ WEB_CRAWLER_URL: values.url }),
};
