import { X } from "lucide-react";
import { createElement } from "react";
import ReactDOMServer from "react-dom/server";
import { CHIP_DATA_ATTR, CHIP_ID_ATTR } from "@/lib/utils/mention-editor-utils";
import type { MentionedDocument } from "@/hooks/use-inline-mention-editor";

interface CreateDocumentChipOptions {
	doc: MentionedDocument;
	onRemove: (docId: number) => void;
	onFocusAtEnd: () => void;
}

/**
 * Creates a DOM element representing a document mention chip
 * This is used by the contentEditable editor to insert document mentions inline
 */
export function createDocumentChipElement({
	doc,
	onRemove,
	onFocusAtEnd,
}: CreateDocumentChipOptions): HTMLSpanElement {
	const chip = document.createElement("span");
	chip.setAttribute(CHIP_DATA_ATTR, "true");
	chip.setAttribute(CHIP_ID_ATTR, String(doc.id));
	chip.contentEditable = "false";
	chip.className =
		"inline-flex items-center gap-0.5 mx-0.5 pl-1 pr-0.5 py-0.5 rounded bg-primary/10 text-xs font-bold text-primary border border-primary/10 select-none";
	chip.style.userSelect = "none";
	chip.style.verticalAlign = "baseline";

	const titleSpan = document.createElement("span");
	titleSpan.className = "max-w-[80px] truncate";
	titleSpan.textContent = doc.title;
	titleSpan.title = doc.title;

	const removeBtn = document.createElement("button");
	removeBtn.type = "button";
	removeBtn.className =
		"size-3 flex items-center justify-center rounded-full hover:bg-primary/20 transition-colors ml-0.5";
	removeBtn.innerHTML = ReactDOMServer.renderToString(
		createElement(X, { className: "h-2.5 w-2.5", strokeWidth: 2.5 })
	);
	removeBtn.onclick = (e) => {
		e.preventDefault();
		e.stopPropagation();
		chip.remove();
		onRemove(doc.id);
		onFocusAtEnd();
	};

	chip.appendChild(titleSpan);
	chip.appendChild(removeBtn);

	return chip;
}
