import { AlertCircleIcon, VideoIcon } from "lucide-react";

interface VideoErrorStateProps {
	title: string;
	error: string;
}

export function VideoErrorState({ title, error }: VideoErrorStateProps) {
	return (
		<div className="my-4 overflow-hidden rounded-xl border border-destructive/20 bg-card">
			<div className="flex items-center gap-3 sm:gap-4 px-4 py-4 sm:px-5 sm:py-5">
				<div className="flex size-9 sm:size-11 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
					<AlertCircleIcon className="size-4 sm:size-5 text-destructive" />
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-1.5 mb-0.5">
						<VideoIcon className="size-3 sm:size-3.5 text-muted-foreground shrink-0" />
						<h3 className="font-medium text-muted-foreground text-xs sm:text-sm leading-tight truncate">
							{title}
						</h3>
					</div>
					<p className="text-destructive/80 text-xs sm:text-sm leading-snug">
						{error}
					</p>
				</div>
			</div>
		</div>
	);
}
