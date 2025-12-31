"use client";

import { useEffect, useRef, useState } from "react";
import { baseApiService } from "@/lib/apis/base-api.service";
import { clearActivePodcastTaskId, setActivePodcastTaskId } from "@/lib/chat/podcast-state";
import { parseTaskStatusResponse, type TaskStatusResponse } from "@/lib/podcast/schemas";
import { PodcastGeneratingState, PodcastErrorState } from "@/components/tool-ui/podcast/podcast-states";
import { PodcastPlayer } from "@/components/tool-ui/podcast/podcast-player";

interface PodcastTaskPollerProps {
	taskId: string;
	title: string;
}

/**
 * Component that polls a Celery task until podcast generation is complete
 * Uses setInterval to check task status every 3 seconds
 */
export function PodcastTaskPoller({ taskId, title }: PodcastTaskPollerProps) {
	const [taskStatus, setTaskStatus] = useState<TaskStatusResponse>({
		status: "processing",
	});
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		// Set this as the active podcast task
		setActivePodcastTaskId(taskId);

		const pollTaskStatus = async () => {
			try {
				const data = await baseApiService.get(`/celery/task/${taskId}`);
				const parsed = parseTaskStatusResponse(data);
				setTaskStatus(parsed);

				// Stop polling when complete
				if (parsed.status !== "processing") {
					if (intervalRef.current) {
						clearInterval(intervalRef.current);
						intervalRef.current = null;
					}
					clearActivePodcastTaskId();
				}
			} catch (error) {
				console.error("Error polling task:", error);
				setTaskStatus({
					status: "error",
					error: error instanceof Error ? error.message : "Failed to check task status",
				});
				if (intervalRef.current) {
					clearInterval(intervalRef.current);
					intervalRef.current = null;
				}
				clearActivePodcastTaskId();
			}
		};

		// Initial poll
		pollTaskStatus();

		// Set up interval
		intervalRef.current = setInterval(pollTaskStatus, 3000);

		// Cleanup on unmount
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
			clearActivePodcastTaskId();
		};
	}, [taskId]);

	// Show loading state while processing
	if (taskStatus.status === "processing") {
		return <PodcastGeneratingState title={title} />;
	}

	// Show error state
	if (taskStatus.status === "error") {
		return <PodcastErrorState title={title} error={taskStatus.error || "Generation failed"} />;
	}

	// Show player when complete
	if (taskStatus.status === "success" && taskStatus.podcast_id) {
		return (
			<PodcastPlayer
				podcastId={taskStatus.podcast_id}
				title={taskStatus.title || title}
				description={
					taskStatus.transcript_entries
						? `${taskStatus.transcript_entries} dialogue entries`
						: "SurfSense AI-generated podcast"
				}
			/>
		);
	}

	// Fallback
	return <PodcastErrorState title={title} error="Unexpected state" />;
}
