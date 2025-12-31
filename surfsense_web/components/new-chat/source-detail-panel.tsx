"use client";

import { useQuery } from "@tanstack/react-query";
import { Hash, Loader2, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type React from "react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { documentsApiService } from "@/lib/apis/documents-api.service";
import { cacheKeys } from "@/lib/query-client/cache-keys";
import { ChunkCard } from "./chunk-card";
import { ChunksNavigation } from "./chunks-navigation";
import { DocumentMetadata } from "./document-metadata";
import { DocumentSummary } from "./document-summary";
import { PanelHeader } from "./panel-header";

interface SourceDetailPanelProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	chunkId: number;
	sourceType: string;
	title: string;
	description?: string;
	url?: string;
	children?: ReactNode;
}

export function SourceDetailPanel({
	open,
	onOpenChange,
	chunkId,
	sourceType,
	title,
	description,
	url,
	children,
}: SourceDetailPanelProps) {
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const hasScrolledRef = useRef(false); // Use ref to avoid stale closures
	const [summaryOpen, setSummaryOpen] = useState(false);
	const [activeChunkIndex, setActiveChunkIndex] = useState<number | null>(null);
	const [mounted, setMounted] = useState(false);
	const [hasScrolledToCited, setHasScrolledToCited] = useState(false);
	const shouldReduceMotion = useReducedMotion();

	useEffect(() => {
		setMounted(true);
	}, []);

	const {
		data: documentData,
		isLoading: isDocumentByChunkFetching,
		error: documentByChunkFetchingError,
	} = useQuery({
		queryKey: cacheKeys.documents.byChunk(chunkId.toString()),
		queryFn: () => documentsApiService.getDocumentByChunk({ chunk_id: chunkId }),
		enabled: !!chunkId && open,
		staleTime: 5 * 60 * 1000,
	});

	const isDirectRenderSource =
		sourceType === "TAVILY_API" ||
		sourceType === "LINKUP_API" ||
		sourceType === "SEARXNG_API" ||
		sourceType === "BAIDU_SEARCH_API";

	// Find cited chunk index
	const citedChunkIndex = documentData?.chunks?.findIndex((chunk) => chunk.id === chunkId) ?? -1;

	// Simple scroll function that scrolls to a chunk by index
	const scrollToChunkByIndex = useCallback(
		(chunkIndex: number, smooth = true) => {
			const scrollContainer = scrollAreaRef.current;
			if (!scrollContainer) return;

			const viewport = scrollContainer.querySelector(
				"[data-radix-scroll-area-viewport]"
			) as HTMLElement | null;
			if (!viewport) return;

			const chunkElement = scrollContainer.querySelector(
				`[data-chunk-index="${chunkIndex}"]`
			) as HTMLElement | null;
			if (!chunkElement) return;

			// Get positions using getBoundingClientRect for accuracy
			const viewportRect = viewport.getBoundingClientRect();
			const chunkRect = chunkElement.getBoundingClientRect();

			// Calculate where to scroll to center the chunk
			const currentScrollTop = viewport.scrollTop;
			const chunkTopRelativeToViewport = chunkRect.top - viewportRect.top + currentScrollTop;
			const scrollTarget =
				chunkTopRelativeToViewport - viewportRect.height / 2 + chunkRect.height / 2;

			viewport.scrollTo({
				top: Math.max(0, scrollTarget),
				behavior: smooth && !shouldReduceMotion ? "smooth" : "auto",
			});

			setActiveChunkIndex(chunkIndex);
		},
		[shouldReduceMotion]
	);

	// Callback ref for the cited chunk - scrolls when the element mounts
	const citedChunkRefCallback = useCallback(
		(node: HTMLDivElement | null) => {
			if (node && !hasScrolledRef.current && open) {
				hasScrolledRef.current = true; // Mark immediately to prevent duplicate scrolls

				// Store the node reference for the delayed scroll
				const scrollToCitedChunk = () => {
					const scrollContainer = scrollAreaRef.current;
					if (!scrollContainer || !node.isConnected) return false;

					const viewport = scrollContainer.querySelector(
						"[data-radix-scroll-area-viewport]"
					) as HTMLElement | null;
					if (!viewport) return false;

					// Get positions
					const viewportRect = viewport.getBoundingClientRect();
					const chunkRect = node.getBoundingClientRect();

					// Calculate scroll position to center the chunk
					const currentScrollTop = viewport.scrollTop;
					const chunkTopRelativeToViewport = chunkRect.top - viewportRect.top + currentScrollTop;
					const scrollTarget =
						chunkTopRelativeToViewport - viewportRect.height / 2 + chunkRect.height / 2;

					viewport.scrollTo({
						top: Math.max(0, scrollTarget),
						behavior: "auto", // Instant scroll for initial positioning
					});

					return true;
				};

				// Scroll multiple times with delays to handle progressive content rendering
				// Each subsequent scroll will correct for any layout shifts
				const scrollAttempts = [50, 150, 300, 600, 1000];

				scrollAttempts.forEach((delay) => {
					setTimeout(() => {
						scrollToCitedChunk();
					}, delay);
				});

				// After final attempt, mark state as scrolled
				setTimeout(
					() => {
						setHasScrolledToCited(true);
						setActiveChunkIndex(citedChunkIndex);
					},
					scrollAttempts[scrollAttempts.length - 1] + 50
				);
			}
		},
		[open, citedChunkIndex]
	);

	// Reset scroll state when panel closes
	useEffect(() => {
		if (!open) {
			hasScrolledRef.current = false;
			setHasScrolledToCited(false);
			setActiveChunkIndex(null);
		}
	}, [open]);

	// Handle escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && open) {
				onOpenChange(false);
			}
		};
		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [open, onOpenChange]);

	// Prevent body scroll when open
	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	const handleUrlClick = (e: React.MouseEvent, clickUrl: string) => {
		e.preventDefault();
		e.stopPropagation();
		window.open(clickUrl, "_blank", "noopener,noreferrer");
	};

	const scrollToChunk = useCallback(
		(index: number) => {
			scrollToChunkByIndex(index, true);
		},
		[scrollToChunkByIndex]
	);

	const panelContent = (
		<AnimatePresence mode="wait">
			{open && (
				<>
					{/* Backdrop */}
					<motion.div
						key="backdrop"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
						onClick={() => onOpenChange(false)}
					/>

					{/* Panel */}
					<motion.div
						key="panel"
						initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
						transition={{
							type: "spring",
							damping: 30,
							stiffness: 300,
						}}
						className="fixed inset-3 sm:inset-6 md:inset-10 lg:inset-16 z-50 flex flex-col bg-background rounded-3xl shadow-2xl border overflow-hidden"
					>
												{/* Header Component */}
						<PanelHeader
							sourceType={sourceType}
							title={title}
							description={description}
							url={url}
							isLoading={isLoading}
							onClose={() => onOpenChange(false)}
						/>

						{/* Loading State */}
						{!isDirectRenderSource && isDocumentByChunkFetching && (
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
						)}

						{/* Error State */}
						{!isDirectRenderSource && documentByChunkFetchingError && (
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
											{documentByChunkFetchingError.message ||
												"An unexpected error occurred. Please try again."}
										</p>
									</div>
									<Button variant="outline" onClick={() => onOpenChange(false)} className="mt-2">
										Close Panel
									</Button>
								</motion.div>
							</div>
						)}

						{/* Direct render for web search providers */}
						{isDirectRenderSource && (
							<ScrollArea className="flex-1">
								<div className="p-6 max-w-3xl mx-auto">
									{url && (
										<Button
											size="default"
											variant="outline"
											onClick={(e) => handleUrlClick(e, url)}
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
						)}

						{/* API-fetched document content */}
						{!isDirectRenderSource && documentData && (
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
															onClick={() => scrollToChunk(idx)}
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
											onOpenChange={setSummaryOpen}
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
													onClick={() => scrollToChunk(citedChunkIndex)}
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
						)}
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);

	if (!mounted) return <>{children}</>;

	return (
		<>
			{children}
			{createPortal(panelContent, globalThis.document.body)}
		</>
	);
}
