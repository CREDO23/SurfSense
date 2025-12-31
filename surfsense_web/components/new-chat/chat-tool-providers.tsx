"use client";

import { DisplayImageToolUI } from "@/components/tool-ui/display-image";
import { GeneratePodcastToolUI } from "@/components/tool-ui/generate-podcast";
import { LinkPreviewToolUI } from "@/components/tool-ui/link-preview";
import { ScrapeWebpageToolUI } from "@/components/tool-ui/scrape-webpage";
import { WriteTodosToolUI } from "@/components/tool-ui/write-todos";

interface ChatToolProvidersProps {
	children: React.ReactNode;
}

/**
 * Wraps children with all chat tool UI providers
 */
export function ChatToolProviders({ children }: ChatToolProvidersProps) {
	return (
		<>
			<GeneratePodcastToolUI />
			<LinkPreviewToolUI />
			<DisplayImageToolUI />
			<ScrapeWebpageToolUI />
			<WriteTodosToolUI />
			{children}
		</>
	);
}
