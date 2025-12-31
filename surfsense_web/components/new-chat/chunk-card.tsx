"use client";

import { forwardRef } from "react";
import { Sparkles } from "lucide-react";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ChunkCardProps {
	chunk: { id: number; content: string };
	index: number;
	totalChunks: number;
	isCited: boolean;
	isActive: boolean;
	disableLayoutAnimation?: boolean;
}

/**
 * Chunk card component for displaying document chunks
 * For large documents (>30 chunks), we disable animation to prevent layout shifts
 * which break auto-scroll functionality
 */
export const ChunkCard = forwardRef<HTMLDivElement, ChunkCardProps>(
	({ chunk, index, totalChunks, isCited, isActive, disableLayoutAnimation }, ref) => {
		return (
			<div
				ref={ref}
				data-chunk-index={index}
				className={cn(
					"group relative rounded-2xl border-2 transition-all duration-300",
					isCited
						? "bg-linear-to-br from-primary/5 via-primary/10 to-primary/5 border-primary shadow-lg shadow-primary/10"
						: "bg-card border-border/50 hover:border-border hover:shadow-md"
				)}
			>
				{/* Cited indicator glow effect */}
				{isCited && <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-xl -z-10" />}

				{/* Header */}
				<div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
					<div className="flex items-center gap-3">
						<div
							className={cn(
								"flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors",
								isCited
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground group-hover:bg-muted/80"
							)}
						>
							{index + 1}
						</div>
						<span className="text-sm text-muted-foreground">of {totalChunks} chunks</span>
					</div>
					{isCited && (
						<Badge variant="default" className="gap-1.5 px-3 py-1">
							<Sparkles className="h-3 w-3" />
							Cited Source
						</Badge>
					)}
				</div>

				{/* Content */}
				<div className="p-5 overflow-hidden">
					<MarkdownViewer content={chunk.content} />
				</div>
			</div>
		);
	}
);

ChunkCard.displayName = "ChunkCard";
