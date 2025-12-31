"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDownIcon } from "lucide-react";
import { Audio } from "@/components/tool-ui/audio";
import { baseApiService } from "@/lib/apis/base-api.service";
import { authenticatedFetch } from "@/lib/auth-utils";
import { parsePodcastDetails } from "@/lib/podcast/schemas";

interface PodcastPlayerProps {
	podcastId: number;
	title: string;
	description?: string;
	durationMs?: number;
}

interface PodcastTranscriptEntry {
	speaker_id: number;
	dialog: string;
}

/**
 * Component that fetches and displays a generated podcast
 * Loads audio blob with authentication and optionally shows transcript
 */
export function PodcastPlayer({ podcastId, title, description, durationMs }: PodcastPlayerProps) {
	const [audioSrc, setAudioSrc] = useState<string | null>(null);
	const [transcript, setTranscript] = useState<{
		loading: boolean;
		data?: PodcastTranscriptEntry[];
	}>({ loading: false });

	// Fetch audio blob
	const fetchAudioBlob = useCallback(async () => {
		try {
			const response = await authenticatedFetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/podcasts/${podcastId}/audio`,
			);
			if (!response.ok) {
				console.error("Failed to fetch podcast audio");
				return;
			}
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			setAudioSrc(url);
		} catch (error) {
			console.error("Error fetching audio:", error);
		}
	}, [podcastId]);

	// Fetch transcript
	const fetchTranscript = useCallback(async () => {
		setTranscript({ loading: true });
		try {
			const data = await baseApiService.get(`/podcasts/${podcastId}`);
			const details = parsePodcastDetails(data);
			setTranscript({ loading: false, data: details.podcast_transcript });
		} catch (error) {
			console.error("Error fetching transcript:", error);
			setTranscript({ loading: false });
		}
	}, [podcastId]);

	useEffect(() => {
		fetchAudioBlob();
		return () => {
			if (audioSrc) {
				URL.revokeObjectURL(audioSrc);
			}
		};
	}, [fetchAudioBlob, audioSrc]);

	if (!audioSrc) {
		return null; // Loading handled by parent
	}

	return (
		<div className="my-4 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
			<Audio
				src={audioSrc}
				title={title}
				description={description}
				durationMs={durationMs}
			/>
			<Collapsible className="mt-4">
				<CollapsibleTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="flex w-full items-center justify-between hover:bg-primary/5"
						onClick={fetchTranscript}
					>
						<span className="text-sm">Show Transcript</span>
						<ChevronDownIcon className="size-4" />
					</Button>
				</CollapsibleTrigger>
				<CollapsibleContent className="mt-2 space-y-2">
					{transcript.loading ? (
						<p className="text-muted-foreground text-sm">Loading transcript...</p>
					) : transcript.data && transcript.data.length > 0 ? (
						transcript.data.map((entry, idx) => (
							<div key={idx} className="rounded-lg bg-background/50 p-3">
								<div className="mb-1 font-medium text-primary text-xs">
									{entry.speaker_id === 1 ? "Host" : "Co-Host"}
								</div>
								<p className="text-foreground text-sm">{entry.dialog}</p>
							</div>
						))
					) : (
						<p className="text-muted-foreground text-sm">No transcript available</p>
					)}
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
