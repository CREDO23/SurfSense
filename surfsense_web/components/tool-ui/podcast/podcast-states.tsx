import { AlertCircleIcon, Loader2Icon, MicIcon } from "lucide-react";

/**
 * Loading state component shown while podcast is being generated
 */
export function PodcastGeneratingState({ title }: { title: string }) {
	return (
		<div className="my-4 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
			<div className="flex items-center gap-4">
				<div className="relative">
					<div className="flex size-16 items-center justify-center rounded-full bg-primary/20">
						<MicIcon className="size-8 text-primary" />
					</div>
					{/* Animated rings */}
					<div className="absolute inset-1 animate-ping rounded-full bg-primary/20" />
				</div>
				<div className="flex-1">
					<h3 className="font-semibold text-foreground text-lg">{title}</h3>
					<div className="mt-2 flex items-center gap-2 text-muted-foreground">
						<Loader2Icon className="size-4 animate-spin" />
						<span className="text-sm">Generating podcast... This may take a few minutes</span>
					</div>
					<div className="mt-3">
						<div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
							<div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * Error state component shown when podcast generation fails
 */
export function PodcastErrorState({ title, error }: { title: string; error: string }) {
	return (
		<div className="my-4 overflow-hidden rounded-xl border border-destructive/20 bg-destructive/5 p-6">
			<div className="flex items-center gap-4">
				<div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-destructive/10">
					<AlertCircleIcon className="size-8 text-destructive" />
				</div>
				<div className="flex-1">
					<h3 className="font-semibold text-foreground">{title}</h3>
					<p className="mt-1 text-destructive text-sm">Failed to generate podcast</p>
					<p className="mt-2 text-muted-foreground text-sm">{error}</p>
				</div>
			</div>
		</div>
	);
}

/**
 * Audio loading state component
 */
export function AudioLoadingState({ title }: { title: string }) {
	return (
		<div className="my-4 overflow-hidden rounded-xl border bg-muted/30 p-6">
			<div className="flex items-center gap-4">
				<div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
					<MicIcon className="size-8 text-primary/50" />
				</div>
				<div className="flex-1">
					<h3 className="font-semibold text-foreground">{title}</h3>
					<div className="mt-2 flex items-center gap-2 text-muted-foreground">
						<Loader2Icon className="size-4 animate-spin" />
						<span className="text-sm">Loading audio...</span>
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * Already generating warning component
 */
export function AlreadyGeneratingWarning() {
	return (
		<div className="my-4 overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
			<div className="flex items-center gap-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
					<MicIcon className="size-5 text-amber-500" />
				</div>
				<div>
					<p className="text-amber-600 dark:text-amber-400 text-sm font-medium">
						Podcast already in progress
					</p>
					<p className="text-muted-foreground text-xs mt-0.5">
						Please wait for the current podcast to complete.
					</p>
				</div>
			</div>
		</div>
	);
}

/**
 * Cancelled state component
 */
export function PodcastCancelledState() {
	return (
		<div className="my-4 rounded-xl border border-muted p-4 text-muted-foreground">
			<p className="flex items-center gap-2">
				<MicIcon className="size-4" />
				<span className="line-through">Podcast generation cancelled</span>
			</p>
		</div>
	);
}
