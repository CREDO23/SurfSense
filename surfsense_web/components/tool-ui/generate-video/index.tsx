"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { CheckIcon, ClipboardIcon, DownloadIcon, VideoIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { VideoErrorState } from "./components/VideoErrorState";
import { VideoLoadingState } from "./components/VideoLoadingState";
import type { GenerateVideoArgs, GenerateVideoResult } from "./types";
import {
	generateVideoScript,
	renderVideo,
	getRenderProgress,
	type VideoInput,
	type ProgressResponse,
} from "@/lib/apis/video-api.service";
import { REMOTION_LAMBDA_ENABLED } from "@/lib/env-config";

type PipelineState =
	| { step: "idle" }
	| { step: "generating_script" }
	| { step: "script_ready"; videoInput: VideoInput }
	| { step: "rendering"; progress: number }
	| { step: "done"; url: string; size: number }
	| { step: "error"; message: string };

function VideoPlayer({ url, topic, size }: { url: string; topic: string; size?: number }) {
	const sizeLabel = size ? `${(size / 1_048_576).toFixed(1)} MB` : null;

	return (
		<div className="my-4 overflow-hidden rounded-xl border bg-card">
			<video
				src={url}
				controls
				autoPlay
				playsInline
				className="w-full bg-black"
				style={{ borderRadius: "8px 8px 0 0" }}
				aria-label={topic}
			>
				Your browser does not support the video tag.
			</video>
			<div className="flex items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3 bg-muted/30">
				<div className="flex items-center gap-2 min-w-0">
					<VideoIcon className="size-3.5 sm:size-4 text-muted-foreground shrink-0" />
					<span className="text-xs sm:text-sm text-muted-foreground truncate">{topic}</span>
					{sizeLabel && (
						<span className="text-[10px] sm:text-xs text-muted-foreground/60 shrink-0">
							({sizeLabel})
						</span>
					)}
				</div>
				<a
					href={url}
					download={`${topic.replace(/[^a-zA-Z0-9]/g, "_")}.mp4`}
					className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors shrink-0"
				>
					<DownloadIcon className="size-3.5" />
					<span className="hidden sm:inline">Download</span>
				</a>
			</div>
		</div>
	);
}

function VideoScriptPreview({ topic, videoInput }: { topic: string; videoInput: VideoInput }) {
	const [copied, setCopied] = useState(false);
	const json = JSON.stringify(videoInput, null, 2);

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(json);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [json]);

	return (
		<div className="my-4 overflow-hidden rounded-xl border bg-card">
			<div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 bg-muted/30 border-b">
				<div className="flex items-center gap-2 min-w-0">
					<VideoIcon className="size-4 sm:size-5 text-primary shrink-0" />
					<div className="min-w-0">
						<h3 className="font-semibold text-foreground text-sm sm:text-base leading-tight truncate">
							{topic}
						</h3>
						<p className="text-muted-foreground text-[10px] sm:text-xs mt-0.5">
							{videoInput.scenes.length} scenes generated — copy JSON to preview in Remotion Studio
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={handleCopy}
					className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
				>
					{copied ? (
						<>
							<CheckIcon className="size-3.5" />
							<span>Copied</span>
						</>
					) : (
						<>
							<ClipboardIcon className="size-3.5" />
							<span>Copy JSON</span>
						</>
					)}
				</button>
			</div>
			<pre className="p-4 sm:p-5 text-[11px] sm:text-xs leading-relaxed overflow-auto max-h-96 text-muted-foreground">
				{json}
			</pre>
		</div>
	);
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function friendlyVideoError(raw: string): string {
	const lower = raw.toLowerCase();
	if (lower.includes("oneOf") || lower.includes("anyof") || lower.includes("response_format") || lower.includes("invalid schema"))
		return "The AI model doesn't support the required output format. Please try a different model or contact support.";
	if (lower.includes("rate limit") || lower.includes("429"))
		return "The AI service is temporarily overloaded. Please wait a moment and try again.";
	if (lower.includes("timeout") || lower.includes("timed out"))
		return "The request took too long. Please try again.";
	if (lower.includes("unauthorized") || lower.includes("401") || lower.includes("api key"))
		return "Authentication failed with the AI service. Please check your API configuration.";
	if (lower.includes("context length") || lower.includes("too many tokens") || lower.includes("maximum context"))
		return "The source content is too long for the AI model. Try with shorter content.";
	if (lower.includes("connection") || lower.includes("network") || lower.includes("econnrefused"))
		return "Could not connect to the server. Please check your connection and try again.";
	return "Something went wrong while generating the video. Please try again.";
}

function VideoGenerationPipeline({
	topic,
	sourceContent,
	searchSpaceId,
}: {
	topic: string;
	sourceContent: string;
	searchSpaceId: number;
}) {
	const [state, setState] = useState<PipelineState>({ step: "idle" });
	const startedRef = useRef(false);

	const run = useCallback(async () => {
		if (startedRef.current) return;
		startedRef.current = true;

		try {
			setState({ step: "generating_script" });
			const videoInput: VideoInput = await generateVideoScript(
				searchSpaceId,
				topic,
				sourceContent,
			);

			if (!REMOTION_LAMBDA_ENABLED) {
				setState({ step: "script_ready", videoInput });
				return;
			}

			setState({ step: "rendering", progress: 0 });
			const { renderId, bucketName } = await renderVideo(videoInput);

			let pending = true;
			while (pending) {
				const result: ProgressResponse = await getRenderProgress(renderId, bucketName);
				switch (result.type) {
					case "error":
						setState({ step: "error", message: result.message });
						pending = false;
						break;
					case "done":
						setState({ step: "done", url: result.url, size: result.size });
						pending = false;
						break;
					case "progress":
						setState({ step: "rendering", progress: result.progress });
						await wait(1500);
						break;
				}
			}
		} catch (err) {
			const raw = err instanceof Error ? err.message : "Video generation failed";
			console.error("[VideoGenerationPipeline]", raw);
			setState({ step: "error", message: friendlyVideoError(raw) });
		}
	}, [topic, sourceContent, searchSpaceId]);

	useEffect(() => {
		run();
	}, [run]);

	switch (state.step) {
		case "idle":
		case "generating_script":
			return <VideoLoadingState topic={topic} step="generating_script" />;
		case "script_ready":
			return <VideoScriptPreview topic={topic} videoInput={state.videoInput} />;
		case "rendering":
			return <VideoLoadingState topic={topic} step="rendering" progress={state.progress} />;
		case "done":
			return <VideoPlayer url={state.url} topic={topic} size={state.size} />;
		case "error":
			return <VideoErrorState title={topic} error={state.message} />;
	}
}

export const GenerateVideoToolUI = makeAssistantToolUI<GenerateVideoArgs, GenerateVideoResult>({
	toolName: "generate_video",
	render: function GenerateVideoUI({ args, result, status }) {
		const topic = args.topic || "Video";

		if (status.type === "running" || status.type === "requires-action") {
			return <VideoLoadingState topic={topic} step="running" />;
		}

		if (status.type === "incomplete") {
			const errorMessage =
				status.reason === "cancelled"
					? "Video generation cancelled"
					: typeof status.error === "string"
						? status.error
						: "An error occurred";

			if (status.reason === "cancelled") {
				return (
					<div className="my-4 rounded-xl border border-muted p-3 sm:p-4 text-muted-foreground">
						<p className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
							<VideoIcon className="size-3.5 sm:size-4" />
							<span className="line-through">{errorMessage}</span>
						</p>
					</div>
				);
			}

			return <VideoErrorState title={topic} error={errorMessage} />;
		}

		if (!result) {
			return <VideoLoadingState topic={topic} step="running" />;
		}

		if (result.status === "error") {
			return <VideoErrorState title={topic} error={result.error || "Video generation failed"} />;
		}

		if (
			result.status === "success" &&
			result.source_content &&
			result.search_space_id
		) {
			return (
				<VideoGenerationPipeline
					topic={result.topic || topic}
					sourceContent={result.source_content}
					searchSpaceId={result.search_space_id}
				/>
			);
		}

		return <VideoErrorState title={topic} error="Missing video generation data" />;
	},
});
