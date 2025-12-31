import { useCallback, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

export function useSourcePanelScroll() {
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const hasScrolledRef = useRef(false);
	const [activeChunkIndex, setActiveChunkIndex] = useState<number | null>(null);
	const [hasScrolledToCited, setHasScrolledToCited] = useState(false);
	const shouldReduceMotion = useReducedMotion();

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
		},
		[shouldReduceMotion]
	);

	const citedChunkRefCallback = useCallback(
		(node: HTMLDivElement | null) => {
			if (!node || hasScrolledRef.current) return;

			const scrollToCitedChunk = () => {
				const scrollContainer = scrollAreaRef.current;
				if (!scrollContainer) return;

				const viewport = scrollContainer.querySelector(
					"[data-radix-scroll-area-viewport]"
				) as HTMLElement | null;
				if (!viewport) return;

				const viewportRect = viewport.getBoundingClientRect();
				const chunkRect = node.getBoundingClientRect();

				// Calculate center position
				const currentScrollTop = viewport.scrollTop;
				const chunkTopRelativeToViewport = chunkRect.top - viewportRect.top + currentScrollTop;
				const scrollTarget =
					chunkTopRelativeToViewport - viewportRect.height / 2 + chunkRect.height / 2;

				viewport.scrollTo({
					top: Math.max(0, scrollTarget),
					behavior: shouldReduceMotion ? "auto" : "smooth",
				});

				hasScrolledRef.current = true;
				setHasScrolledToCited(true);
			};

			// Use requestAnimationFrame to ensure DOM is painted
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					scrollToCitedChunk();
				});
			});
		},
		[shouldReduceMotion]
	);

	const scrollToChunk = useCallback(
		(index: number) => {
			scrollToChunkByIndex(index, true);
		},
		[scrollToChunkByIndex]
	);

	return {
		scrollAreaRef,
		hasScrolledRef,
		activeChunkIndex,
		setActiveChunkIndex,
		hasScrolledToCited,
		setHasScrolledToCited,
		shouldReduceMotion,
		scrollToChunkByIndex,
		citedChunkRefCallback,
		scrollToChunk,
	};
}
