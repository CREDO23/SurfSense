import { motion } from "motion/react";
import { Loader2, X, ExternalLink, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function PanelLoadingState() {
	return (
		<div className="flex-1 flex items-center justify-center">
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				className="flex flex-col items-center gap-4"
			>
				<div className="relative">
					<div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
					<Loader2 className="h-12 w-12 animate-spin text-primary relative" />
				</div>
				<p className="text-sm text-muted-foreground font-medium">Loading document...</p>
			</motion.div>
		</div>
	);
}

interface PanelErrorStateProps {
	error: Error;
	onClose: () => void;
}

export function PanelErrorState({ error, onClose }: PanelErrorStateProps) {
	return (
		<div className="flex-1 flex items-center justify-center">
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				className="flex flex-col items-center gap-4 text-center px-6"
			>
				<div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
					<X className="h-10 w-10 text-destructive" />
				</div>
				<div>
					<p className="font-semibold text-destructive text-lg">
						Failed to load document
					</p>
					<p className="text-sm text-muted-foreground mt-2 max-w-md">
						{error.message || "An unexpected error occurred. Please try again."}
					</p>
				</div>
				<Button variant="outline" onClick={onClose} className="mt-2">
					Close Panel
				</Button>
			</motion.div>
		</div>
	);
}

interface DirectRenderSourceViewProps {
	title?: string;
	description?: string;
	url?: string;
	onUrlClick: (e: React.MouseEvent, url: string) => void;
}

export function DirectRenderSourceView({
	title,
	description,
	url,
	onUrlClick,
}: DirectRenderSourceViewProps) {
	return (
		<ScrollArea className="flex-1">
			<div className="p-6 max-w-3xl mx-auto">
				{url && (
					<Button
						size="default"
						variant="outline"
						onClick={(e) => onUrlClick(e, url)}
						className="w-full mb-6 sm:hidden rounded-xl"
					>
						<ExternalLink className="mr-2 h-4 w-4" />
						Open in Browser
					</Button>
				)}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="p-6 bg-muted/50 rounded-2xl border"
				>
					<h3 className="text-base font-semibold mb-4 flex items-center gap-2">
						<BookOpen className="h-4 w-4" />
						Source Information
					</h3>
					<div className="text-sm text-muted-foreground mb-3 font-medium">
						{title || "Untitled"}
					</div>
					<div className="text-sm text-foreground leading-relaxed">
						{description || "No content available"}
					</div>
				</motion.div>
			</div>
		</ScrollArea>
	);
}
