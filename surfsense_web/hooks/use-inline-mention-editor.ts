import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Document } from "@/contracts/types/document.types";
import {
	CHIP_DATA_ATTR,
	CHIP_ID_ATTR,
	extractPlainText,
	findMentionQuery,
	getChipId,
	isChipElement,
} from "@/lib/utils/mention-editor-utils";

export interface MentionedDocument {
	id: number;
	title: string;
	document_type?: string;
}

export interface InlineMentionEditorRef {
	focus: () => void;
	clear: () => void;
	getText: () => string;
	getMentionedDocuments: () => MentionedDocument[];
	insertDocumentChip: (doc: Document) => void;
}

interface UseInlineMentionEditorProps {
	editorRef: React.RefObject<HTMLDivElement>;
	ref: React.Ref<InlineMentionEditorRef>;
	initialDocuments?: MentionedDocument[];
	onMentionTrigger?: (query: string) => void;
	onMentionClose?: () => void;
	onChange?: (text: string, docs: MentionedDocument[]) => void;
	onDocumentRemove?: (docId: number) => void;
	onSubmit?: () => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
	creatChipElement: (doc: MentionedDocument) => HTMLSpanElement;
}

export function useInlineMentionEditor({
	editorRef,
	ref,
	initialDocuments = [],
	onMentionTrigger,
	onMentionClose,
	onChange,
	onDocumentRemove,
	onSubmit,
	onKeyDown,
	creatChipElement,
}: UseInlineMentionEditorProps) {
	const [isEmpty, setIsEmpty] = useState(true);
	const [mentionedDocs, setMentionedDocs] = useState<Map<number, MentionedDocument>>(
		() => new Map(initialDocuments.map((d) => [d.id, d]))
	);
	const isComposingRef = useRef(false);

	// Sync initial documents
	useEffect(() => {
		if (initialDocuments.length > 0) {
			setMentionedDocs(new Map(initialDocuments.map((d) => [d.id, d])));
		}
	}, [initialDocuments]);

	// Focus at the end of the editor
	const focusAtEnd = useCallback(() => {
		if (!editorRef.current) return;
		editorRef.current.focus();
		const selection = window.getSelection();
		const range = document.createRange();
		range.selectNodeContents(editorRef.current);
		range.collapse(false);
		selection?.removeAllRanges();
		selection?.addRange(range);
	}, [editorRef]);

	// Get plain text content (excluding chips)
	const getText = useCallback((): string => {
		return extractPlainText(editorRef.current);
	}, [editorRef]);

	// Get all mentioned documents
	const getMentionedDocuments = useCallback((): MentionedDocument[] => {
		return Array.from(mentionedDocs.values());
	}, [mentionedDocs]);

	// Insert a document chip at the current cursor position
	const insertDocumentChip = useCallback(
		(doc: Document) => {
			if (!editorRef.current) return;

			// Validate required fields for type safety
			if (typeof doc.id !== "number" || typeof doc.title !== "string") {
				console.warn("[InlineMentionEditor] Invalid document passed to insertDocumentChip:", doc);
				return;
			}

			const mentionDoc: MentionedDocument = {
				id: doc.id,
				title: doc.title,
				document_type: doc.document_type,
			};

			// Add to mentioned docs map
			setMentionedDocs((prev) => new Map(prev).set(doc.id, mentionDoc));

			// Find and remove the @query text
			const selection = window.getSelection();
			if (!selection || selection.rangeCount === 0) {
				// No selection, just append
				const chip = creatChipElement(mentionDoc);
				editorRef.current.appendChild(chip);
				editorRef.current.appendChild(document.createTextNode(" "));
				focusAtEnd();
				return;
			}

			// Find the @ symbol before the cursor and remove it along with any query text
			const range = selection.getRangeAt(0);
			const textNode = range.startContainer;

			if (textNode.nodeType === Node.TEXT_NODE) {
				const text = textNode.textContent || "";
				const cursorPos = range.startOffset;

				// Find the @ symbol before cursor
				let atIndex = -1;
				for (let i = cursorPos - 1; i >= 0; i--) {
					if (text[i] === "@") {
						atIndex = i;
						break;
					}
				}

				if (atIndex !== -1) {
					// Remove @query and insert chip
					const beforeAt = text.slice(0, atIndex);
					const afterCursor = text.slice(cursorPos);

					// Create chip
					const chip = creatChipElement(mentionDoc);

					// Replace text node content
					const parent = textNode.parentNode;
					if (parent) {
						const beforeNode = document.createTextNode(beforeAt);
						const afterNode = document.createTextNode(` ${afterCursor}`);

						parent.insertBefore(beforeNode, textNode);
						parent.insertBefore(chip, textNode);
						parent.insertBefore(afterNode, textNode);
						parent.removeChild(textNode);

						// Set cursor after the chip
						const newRange = document.createRange();
						newRange.setStart(afterNode, 1);
						newRange.collapse(true);
						selection.removeAllRanges();
						selection.addRange(newRange);
					}
				} else {
					// No @ found, just insert at cursor
					const chip = creatChipElement(mentionDoc);
					range.insertNode(chip);
					range.setStartAfter(chip);
					range.collapse(true);

					// Add space after chip
					const space = document.createTextNode(" ");
					range.insertNode(space);
					range.setStartAfter(space);
					range.collapse(true);
				}
			} else {
				// Not in a text node, append to editor
				const chip = creatChipElement(mentionDoc);
				editorRef.current.appendChild(chip);
				editorRef.current.appendChild(document.createTextNode(" "));
				focusAtEnd();
			}

			// Update empty state
			setIsEmpty(false);

			// Trigger onChange
			if (onChange) {
				setTimeout(() => {
					onChange(getText(), getMentionedDocuments());
				}, 0);
			}
		},
		[creatChipElement, editorRef, focusAtEnd, getText, getMentionedDocuments, onChange]
	);

	// Clear the editor
	const clear = useCallback(() => {
		if (editorRef.current) {
			editorRef.current.innerHTML = "";
			setIsEmpty(true);
			setMentionedDocs(new Map());
		}
	}, [editorRef]);

	// Expose methods via ref
	useImperativeHandle(ref, () => ({
		focus: () => editorRef.current?.focus(),
		clear,
		getText,
		getMentionedDocuments,
		insertDocumentChip,
	}));

	// Handle input changes
	const handleInput = useCallback(() => {
		if (!editorRef.current) return;

		const text = getText();
		const empty = text.length === 0 && mentionedDocs.size === 0;
		setIsEmpty(empty);

		// Check for @ mentions
		const selection = window.getSelection();
		const { found, query } = findMentionQuery(selection);

		// If no @ found before cursor, check if text contains @ at all
		// If text is empty or doesn't contain @, close the mention
		if (!found) {
			if (text.length === 0 || !text.includes("@")) {
				onMentionClose?.();
			} else {
				// Text contains @ but not before cursor, close mention
				onMentionClose?.();
			}
		} else {
			onMentionTrigger?.(query);
		}

		// Notify parent of change
		onChange?.(text, Array.from(mentionedDocs.values()));
	}, [editorRef, getText, mentionedDocs, onChange, onMentionTrigger, onMentionClose]);

	// Handle keydown
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			// Let parent handle navigation keys when mention popover is open
			if (onKeyDown) {
				onKeyDown(e);
				if (e.defaultPrevented) return;
			}

			// Handle Enter for submit (without shift)
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				onSubmit?.();
				return;
			}

			// Handle backspace on chips
			if (e.key === "Backspace") {
				const selection = window.getSelection();
				if (selection && selection.rangeCount > 0) {
					const range = selection.getRangeAt(0);
					if (range.collapsed) {
						// Check if cursor is right after a chip
						const node = range.startContainer;
						const offset = range.startOffset;

						if (node.nodeType === Node.TEXT_NODE && offset === 0) {
							// Check previous sibling using type guard
							const prevSibling = node.previousSibling;
							if (isChipElement(prevSibling)) {
								e.preventDefault();
								const chipId = getChipId(prevSibling);
								if (chipId !== null) {
									prevSibling.remove();
									setMentionedDocs((prev) => {
										const next = new Map(prev);
										next.delete(chipId);
										return next;
									});
									// Notify parent that a document was removed
									onDocumentRemove?.(chipId);
								}
								return;
							}
							// Check if we're about to delete @ at the start
							const textContent = node.textContent || "";
							if (textContent.length > 0 && textContent[0] === "@") {
								// Will delete @, close mention popover
								setTimeout(() => {
									onMentionClose?.();
								}, 0);
							}
						} else if (node.nodeType === Node.TEXT_NODE && offset > 0) {
							// Check if we're about to delete @
							const textContent = node.textContent || "";
							if (textContent[offset - 1] === "@") {
								// Will delete @, close mention popover
								setTimeout(() => {
									onMentionClose?.();
								}, 0);
							}
						} else if (node.nodeType === Node.ELEMENT_NODE && offset > 0) {
							// Check if previous child is a chip using type guard
							const prevChild = (node as Element).childNodes[offset - 1];
							if (isChipElement(prevChild)) {
								e.preventDefault();
								const chipId = getChipId(prevChild);
								if (chipId !== null) {
									prevChild.remove();
									setMentionedDocs((prev) => {
										const next = new Map(prev);
										next.delete(chipId);
										return next;
									});
									// Notify parent that a document was removed
									onDocumentRemove?.(chipId);
								}
							}
						}
					}
				}
			}
		},
		[onKeyDown, onSubmit, onDocumentRemove, onMentionClose]
	);

	// Handle paste - strip formatting
	const handlePaste = useCallback((e: React.ClipboardEvent) => {
		e.preventDefault();
		const text = e.clipboardData.getData("text/plain");
		document.execCommand("insertText", false, text);
	}, []);

	// Handle composition (for IME input)
	const handleCompositionStart = useCallback(() => {
		isComposingRef.current = true;
	}, []);

	const handleCompositionEnd = useCallback(() => {
		isComposingRef.current = false;
		handleInput();
	}, [handleInput]);

	return {
		isEmpty,
		mentionedDocs,
		handleInput,
		handleKeyDown,
		handlePaste,
		handleCompositionStart,
		handleCompositionEnd,
	};
}
