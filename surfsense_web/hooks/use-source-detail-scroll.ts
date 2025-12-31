/**
 * Hook for managing scroll behavior in the source detail panel.
 * Handles scrolling to specific chunks, cited chunk auto-scroll, and active chunk tracking.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

interface UseSourceDetailScrollOptions {
	open: boolean;
	citedChunkIndex: number;
}

interface UseSourceDetailScrollReturn {
	scrollAreaRef: React.RefObject<HTMLDivElement>;
	hasScrolledToCited: boolean;
	activeChunkIndex: number | null;
	scrollToChunkByIndex: (chunkIndex: number, smooth?: boolean) => void;
	citedChunkRefCallback: (node: HTMLDivElement | null) => void;
}

export function useSourceDetailScroll({
	open,
	citedChunkIndex,
}: UseSourceDetailScrollOptions): UseSourceDetailScrollReturn {
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const hasScrolledRef = useRef(false);
	const [hasScrolledToCited, setHasScrolledToCited] = useState(false);
	const [activeChunkIndex, setActiveChunkIndex] = useState<number | null>(null);
	const shouldReduceMotion = useReducedMotion();

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

	return {
		scrollAreaRef,
		hasScrolledToCited,
		activeChunkIndex,
		scrollToChunkByIndex,
		citedChunkRefCallback,
	};
}
