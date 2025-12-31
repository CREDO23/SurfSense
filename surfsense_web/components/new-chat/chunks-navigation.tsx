"use client";

import { ChevronUp } from "lucide-react";
import { motion } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface ChunksNavigationProps {
	chunks: Array<{ id: number; content: string }>;
	citedChunkId: number;
	activeChunkIndex: number | null;
	onChunkClick: (index: number) => void;
	isLargeDocument: boolean;
}

export function ChunksNavigation({
	chunks,
	citedChunkId,
	activeChunkIndex,
	onChunkClick,
	isLargeDocument,
}: ChunksNavigationProps) {
	if (isLargeDocument) {
		return null;
	}

	return (
		<motion.div
			initial={{ x: -20, opacity: 0 }}
			animate={{ x: 0, opacity: 1 }}
			exit={{ x: -20, opacity: 0 }}
			transition={{ type: "spring", stiffness: 300, damping: 30 }}
			className="hidden lg:flex flex-col w-64 border-r bg-muted/30"
		>
			{/* Sidebar Header */}
			<div className="p-4 border-b bg-background/50">
				<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
					Quick Jump
				</h3>
				<p className="text-xs text-muted-foreground mt-1">
					{chunks.length} {chunks.length === 1 ? "chunk" : "chunks"}
				</p>
			</div>

			{/* Navigation Items */}
			<ScrollArea className="flex-1">
				<div className="p-2 space-y-1">
					{chunks.map((chunk, idx) => {
						const isCited = chunk.id === citedChunkId;
						const isActive = activeChunkIndex === idx;

						return (
							<motion.button
								key={chunk.id}
								type="button"
								onClick={() => onChunkClick(idx)}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className={cn(
									"w-full text-left p-3 rounded-xl transition-all duration-200",
									"flex items-start gap-3 group",
									isCited
										? "bg-primary/10 border-2 border-primary/50 hover:bg-primary/15"
										: isActive
											? "bg-muted border border-border"
											: "hover:bg-muted/50"
								)}
							>
								{/* Chunk Number */}
								<div
									className={cn(
										"flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors",
										isCited
											? "bg-primary text-primary-foreground"
											: "bg-background text-muted-foreground group-hover:bg-background/80"
									)}
								>
									{idx + 1}
								</div>

								{/* Chunk Preview */}
								<div className="flex-1 min-w-0">
									<p className="text-xs line-clamp-2 text-muted-foreground group-hover:text-foreground transition-colors">
										{chunk.content}
									</p>
									{isCited && (
										<span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium text-primary">
											<ChevronUp className="h-3 w-3" />
											Cited
										</span>
									)}
								</div>
							</motion.button>
						);
					})}
				</div>
			</ScrollArea>
		</motion.div>
	);
}
