/**
 * Utility functions and constants for the inline mention editor
 */

// Unique data attributes to identify chip elements
export const CHIP_DATA_ATTR = "data-mention-chip";
export const CHIP_ID_ATTR = "data-mention-id";

/**
 * Type guard to check if a node is a chip element
 */
export function isChipElement(node: Node | null): node is HTMLSpanElement {
	return (
		node !== null &&
		node.nodeType === Node.ELEMENT_NODE &&
		(node as Element).hasAttribute(CHIP_DATA_ATTR)
	);
}

/**
 * Safely parse chip ID from element attribute
 */
export function getChipId(element: Element): number | null {
	const idStr = element.getAttribute(CHIP_ID_ATTR);
	if (!idStr) return null;
	const id = parseInt(idStr, 10);
	return Number.isNaN(id) ? null : id;
}

/**
 * Extract plain text content from contentEditable element, excluding chip elements
 */
export function extractPlainText(editorElement: HTMLElement | null): string {
	if (!editorElement) return "";

	let text = "";
	const walker = document.createTreeWalker(
		editorElement,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
		{
			acceptNode: (node) => {
				// Skip chip elements entirely
				if (node.nodeType === Node.ELEMENT_NODE) {
					const el = node as Element;
					if (el.hasAttribute(CHIP_DATA_ATTR)) {
						return NodeFilter.FILTER_REJECT; // Skip this subtree
					}
					return NodeFilter.FILTER_SKIP; // Continue into children
				}
				return NodeFilter.FILTER_ACCEPT;
			},
		}
	);

	let node: Node | null = walker.nextNode();
	while (node) {
		if (node.nodeType === Node.TEXT_NODE) {
			text += node.textContent;
		}
		node = walker.nextNode();
	}

	return text.trim();
}

/**
 * Find @ mention query before cursor position
 * Returns { found: boolean, query: string }
 */
export function findMentionQuery(
	selection: Selection | null
): { found: boolean; query: string } {
	if (!selection || selection.rangeCount === 0) {
		return { found: false, query: "" };
	}

	const range = selection.getRangeAt(0);
	const textNode = range.startContainer;

	if (textNode.nodeType !== Node.TEXT_NODE) {
		return { found: false, query: "" };
	}

	const textContent = textNode.textContent || "";
	const cursorPos = range.startOffset;

	// Look for @ before cursor
	let atIndex = -1;
	for (let i = cursorPos - 1; i >= 0; i--) {
		if (textContent[i] === "@") {
			atIndex = i;
			break;
		}
		// Stop if we hit a space (@ must be at word boundary)
		if (textContent[i] === " " || textContent[i] === "\n") {
			break;
		}
	}

	if (atIndex === -1) {
		return { found: false, query: "" };
	}

	const query = textContent.slice(atIndex + 1, cursorPos);
	// Only trigger if query doesn't start with space
	if (query.startsWith(" ")) {
		return { found: false, query: "" };
	}

	return { found: true, query };
}
