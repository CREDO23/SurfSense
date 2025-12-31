// BlockNote types
export type BlockNoteInlineContent =
	| string
	| { text?: string; type?: string; styles?: Record<string, unknown> };

export interface BlockNoteBlock {
	type: string;
	content?: BlockNoteInlineContent[];
	children?: BlockNoteBlock[];
	props?: Record<string, unknown>;
}

export type BlockNoteDocument = BlockNoteBlock[] | null | undefined;

export interface EditorContent {
	document_id: number;
	title: string;
	document_type?: string;
	blocknote_document: BlockNoteDocument;
	updated_at: string | null;
}

// Helper function to extract title from BlockNote document
// Takes the text content from the first block (should be a heading for notes)
export function extractTitleFromBlockNote(blocknoteDocument: BlockNoteDocument): string {
	if (!blocknoteDocument || !Array.isArray(blocknoteDocument) || blocknoteDocument.length === 0) {
		return "Untitled";
	}

	const firstBlock = blocknoteDocument[0];
	if (!firstBlock) {
		return "Untitled";
	}

	// Extract text from block content
	// BlockNote blocks have a content array with inline content
	if (firstBlock.content && Array.isArray(firstBlock.content)) {
		const textContent = firstBlock.content
			.map((item: BlockNoteInlineContent) => {
				if (typeof item === "string") return item;
				if (typeof item === "object" && item?.text) return item.text;
				return "";
			})
			.join("")
			.trim();
		return textContent || "Untitled";
	}

	return "Untitled";
}
