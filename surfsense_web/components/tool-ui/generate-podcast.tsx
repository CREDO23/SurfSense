"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { MicIcon } from "lucide-react";
import type { GeneratePodcastArgs, GeneratePodcastResult } from "@/lib/podcast/schemas";
import {
	PodcastGeneratingState,
	PodcastErrorState,
	AlreadyGeneratingWarning,
	PodcastCancelledState,
} from "@/components/tool-ui/podcast/podcast-states";
import { PodcastPlayer } from "@/components/tool-ui/podcast/podcast-player";
import { PodcastTaskPoller } from "@/components/tool-ui/podcast/podcast-task-poller";

/**
 * Generate Podcast Tool UI Component
 *
 * This component is registered with assistant-ui to render custom UI
 * when the generate_podcast tool is called by the agent.
 *
 * It polls for task completion and auto-updates when the podcast is ready.
 */
export const GeneratePodcastToolUI = makeAssistantToolUI<
	GeneratePodcastArgs,
	GeneratePodcastResult
>({
	toolName: "generate_podcast",
	render: function GeneratePodcastUI({ args, result, status }) {
		const title = args.podcast_title || "SurfSense Podcast";

		// Loading state - tool is still running (agent processing)
		if (status.type === "running" || status.type === "requires-action") {
			return <PodcastGeneratingState title={title} />;
		}

		// Incomplete/cancelled state
		if (status.type === "incomplete") {
			if (status.reason === "cancelled") {
				return <PodcastCancelledState />;
			}
			if (status.reason === "error") {
				return (
					<PodcastErrorState
						title={title}
						error={typeof status.error === "string" ? status.error : "An error occurred"}
					/>
				);
			}
		}

		// No result yet
		if (!result) {
			return <PodcastGeneratingState title={title} />;
		}

		// Error result
		if (result.status === "error") {
			return <PodcastErrorState title={title} error={result.error || "Unknown error"} />;
		}

		// Already generating - show simple warning, don't create another poller
		// The FIRST tool call will display the podcast when ready
		if (result.status === "already_generating") {
			return <AlreadyGeneratingWarning />;
		}

		// Processing - poll for completion
		if (result.status === "processing" && result.task_id) {
			return <PodcastTaskPoller taskId={result.task_id} title={result.title || title} />;
		}

		// Success with podcast_id (direct result, not via polling)
		if (result.status === "success" && result.podcast_id) {
			return (
				<PodcastPlayer
					podcastId={result.podcast_id}
					title={result.title || title}
					description={
						result.transcript_entries
							? `${result.transcript_entries} dialogue entries`
							: "SurfSense AI-generated podcast"
					}
				/>
			);
		}

		// Fallback - missing required data
		return <PodcastErrorState title={title} error="Missing task ID or podcast ID" />;
	},
});
