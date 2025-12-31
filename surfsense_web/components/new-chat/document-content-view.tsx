import { motion } from "motion/react";
import { Hash, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChunkCard } from "./chunk-card";
import { DocumentMetadata } from "./document-metadata";
import { DocumentSummary } from "./document-summary";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/document";

interface DocumentContentViewProps {
	documentData: Document;
	chunkId: number;
	activeChunkIndex: number | null;
	scrollAreaRef: React.RefObject<HTMLDivElement>;
	citedChunkRefCallback: (node: HTMLDivElement | null) => void;
	summaryOpen: boolean;
	onSummaryOpenChange: (open: boolean) => void;
	onScrollToChunk: (index: number) => void;
}

export function DocumentContentView({
	documentData,
	chunkId,
	activeChunkIndex,
	scrollAreaRef,
	citedChunkRefCallback,
	summaryOpen,
	onSummaryOpenChange,
	onScrollToChunk,
}: DocumentContentViewProps) {
	const citedChunkIndex = documentData?.chunks?.findIndex((chunk) => chunk.id === chunkId) ?? -1;

	return (
		<div className="flex-1 flex overflow-hidden">
			{/* Chunk Navigation Sidebar */}
			{documentData.chunks.length > 1 && (
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.2 }}
					className="hidden lg:flex flex-col w-16 border-r bg-muted/10 overflow-hidden"
				>
					<ScrollArea className="flex-1 h-full">
						<div className="p-2 pt-3 flex flex-col gap-1.5">
							{documentData.chunks.map((chunk, idx) => {
								const isCited = chunk.id === chunkId;
								const isActive = activeChunkIndex === idx;
								return (
									<motion.button
										key={chunk.id}
										type="button"
										onClick={() => onScrollToChunk(idx)}
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ delay: Math.min(idx * 0.02, 0.2) }}
										className={cn(
											"relative w-11 h-9 mx-auto rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center",
											isCited
												? "bg-primary text-primary-foreground shadow-md"
												: isActive
													? "bg-muted text-foreground"
													: "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
										)}
										title={isCited ? `Chunk ${idx + 1} (Cited)` : `Chunk ${idx + 1}`}
									>
										{idx + 1}
										{isCited && (
											<span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background">
												<Sparkles className="h-2 w-2 text-primary-foreground absolute top-0.5 left-0.5" />
											</span>
										)}
									</motion.button>
								);
							})}
						</div>
					</ScrollArea>
				</motion.div>
			)}

			{/* Main Content */}
			<ScrollArea className="flex-1" ref={scrollAreaRef}>
				<div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
					{/* Document Metadata */}
					<DocumentMetadata
						metadata={documentData.document_metadata || {}}
						delay={0.1}
					/>

					{/* Summary Collapsible */}
					<DocumentSummary
						content={documentData.content || ""}
						open={summaryOpen}
						onOpenChange={onSummaryOpenChange}
						delay={0.15}
					/>

					{/* Chunks Header */}
					<div className="flex items-center justify-between pt-4">
						<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
							<Hash className="h-4 w-4" />
							Content Chunks
						</h3>
						{citedChunkIndex !== -1 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onScrollToChunk(citedChunkIndex)}
								className="gap-2 text-primary hover:text-primary"
							>
								<Sparkles className="h-3.5 w-3.5" />
								Jump to cited
							</Button>
						)}
					</div>

					{/* Chunks */}
					<div className="space-y-4">
						{documentData.chunks.map((chunk, idx) => {
							const isCited = chunk.id === chunkId;
							return (
								<ChunkCard
									key={chunk.id}
									ref={isCited ? citedChunkRefCallback : undefined}
									chunk={chunk}
									index={idx}
									totalChunks={documentData.chunks.length}
									isCited={isCited}
									isActive={activeChunkIndex === idx}
									disableLayoutAnimation={documentData.chunks.length > 30}
								/>
							);
						})}
					</div>
				</div>
			</ScrollArea>
		</div>
	);
}
