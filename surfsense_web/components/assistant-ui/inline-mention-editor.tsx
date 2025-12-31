"use client";

import { forwardRef, useCallback, useRef } from "react";
import type { Document } from "@/contracts/types/document.types";
import { createDocumentChipElement } from "@/components/assistant-ui/document-chip";
import {
	type InlineMentionEditorRef,
	type MentionedDocument,
	useInlineMentionEditor,
} from "@/hooks/use-inline-mention-editor";
import { cn } from "@/lib/utils";

export type { MentionedDocument, InlineMentionEditorRef };

interface InlineMentionEditorProps {
	placeholder?: string;
	onMentionTrigger?: (query: string) => void;
	onMentionClose?: () => void;
	onSubmit?: () => void;
	onChange?: (text: string, docs: MentionedDocument[]) => void;
	onDocumentRemove?: (docId: number) => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
	disabled?: boolean;
	className?: string;
	initialDocuments?: MentionedDocument[];
}

export const InlineMentionEditor = forwardRef<InlineMentionEditorRef, InlineMentionEditorProps>(
	(
		{
			placeholder = "Type @ to mention documents...",
			onMentionTrigger,
			onMentionClose,
			onSubmit,
			onChange,
			onDocumentRemove,
			onKeyDown,
			disabled = false,
			className,
			initialDocuments = [],
		},
		ref
	) => {
		const editorRef = useRef<HTMLDivElement>(null);

		// Factory function for creating document chips
		const creatChipElement = useCallback(
			(doc: MentionedDocument) => {
				return createDocumentChipElement({
					doc,
					onRemove: (docId) => {
						onDocumentRemove?.(docId);
					},
					onFocusAtEnd: () => {
						if (!editorRef.current) return;
						editorRef.current.focus();
						const selection = window.getSelection();
						const range = document.createRange();
						range.selectNodeContents(editorRef.current);
						range.collapse(false);
						selection?.removeAllRanges();
						selection?.addRange(range);
					},
				});
			},
			[onDocumentRemove]
		);

		// Use the custom hook for all editor logic
		const {
			isEmpty,
			handleInput,
			handleKeyDown: hookHandleKeyDown,
			handlePaste,
			handleCompositionStart,
			handleCompositionEnd,
		} = useInlineMentionEditor({
			editorRef,
			ref,
			initialDocuments,
			onMentionTrigger,
			onMentionClose,
			onChange,
			onDocumentRemove,
			onSubmit,
			onKeyDown,
			creatChipElement,
		});

		return (
			<div className="relative w-full">
				{/** biome-ignore lint/a11y/useSemanticElements: <not important> */}
				<div
					ref={editorRef}
					contentEditable={!disabled}
					suppressContentEditableWarning
					tabIndex={disabled ? -1 : 0}
					onInput={handleInput}
					onKeyDown={hookHandleKeyDown}
					onPaste={handlePaste}
					onCompositionStart={handleCompositionStart}
					onCompositionEnd={handleCompositionEnd}
					className={cn(
						"min-h-[24px] max-h-32 overflow-y-auto",
						"text-sm outline-none",
						"whitespace-pre-wrap break-words",
						disabled && "opacity-50 cursor-not-allowed",
						className
					)}
					style={{ wordBreak: "break-word" }}
					data-placeholder={placeholder}
					aria-label="Message input with inline mentions"
					role="textbox"
					aria-multiline="true"
				/>
				{/* Placeholder */}
				{isEmpty && (
					<div
						className="absolute top-0 left-0 pointer-events-none text-muted-foreground text-sm"
						aria-hidden="true"
					>
						{placeholder}
					</div>
				)}
			</div>
		);
	}
);

InlineMentionEditor.displayName = "InlineMentionEditor";
