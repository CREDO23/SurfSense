import { useState, useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { hasUnsavedEditorChangesAtom, pendingEditorNavigationAtom } from "@/atoms/editor/ui.atoms";
import { notesApiService } from "@/lib/apis/notes-api.service";
import { authenticatedFetch, getBearerToken, redirectToLogin } from "@/lib/auth-utils";
import type { BlockNoteDocument, EditorContent } from "@/lib/editor-utils";
import { extractTitleFromBlockNote } from "@/lib/editor-utils";

interface UseEditorStateProps {
	documentId: string;
	searchSpaceId: number;
	isNewNote: boolean;
}

export function useEditorState({ documentId, searchSpaceId, isNewNote }: UseEditorStateProps) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const [document, setDocument] = useState<EditorContent | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editorContent, setEditorContent] = useState<BlockNoteDocument>(null);
	const [error, setError] = useState<string | null>(null);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

	// Global state for cross-component communication
	const [, setGlobalHasUnsavedChanges] = useAtom(hasUnsavedEditorChangesAtom);
	const [pendingNavigation, setPendingNavigation] = useAtom(pendingEditorNavigationAtom);

	// Sync local unsaved changes state with global atom
	useEffect(() => {
		setGlobalHasUnsavedChanges(hasUnsavedChanges);
	}, [hasUnsavedChanges, setGlobalHasUnsavedChanges]);

	// Fetch document
	useEffect(() => {
		async function fetchDocument() {
			if (isNewNote) {
				setLoading(false);
				return;
			}

			const token = getBearerToken();
			if (!token) {
				redirectToLogin();
				return;
			}

			try {
				const response = await authenticatedFetch(
					`${process.env.NEXT_PUBLIC_FASTAPI_BACKEND_URL}/api/v1/search-spaces/${searchSpaceId}/documents/${documentId}`,
					{
						method: "GET",
						headers: { "Content-Type": "application/json" },
					}
				);

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({ detail: "Failed to fetch document" }));
					const errorMsg =
						response.status === 404
							? "Document not found. It may have been deleted."
							: errorData.detail || "Failed to fetch document. Please try again.";
					setError(errorMsg);
					setLoading(false);
					return;
				}

				const data = await response.json();

				// Validate required fields
				if (!data || typeof data.id === "undefined") {
					const errorMsg = "Invalid document data received from server.";
					setError(errorMsg);
					setLoading(false);
					return;
				}

				setDocument(data);
				setEditorContent(data.blocknote_document);
				setError(null);
			} catch (error) {
				console.error("Error fetching document:", error);
				const errorMessage =
					error instanceof Error ? error.message : "Failed to fetch document. Please try again.";
				setError(errorMessage);
			} finally {
				setLoading(false);
			}
		}

		if (documentId) {
			fetchDocument();
		}
	}, [documentId, searchSpaceId, isNewNote]);

	// Track changes to mark as unsaved
	useEffect(() => {
		if (editorContent && document) {
			setHasUnsavedChanges(true);
		}
	}, [editorContent, document]);

	// Check if this is a NOTE type document
	const isNote = isNewNote || document?.document_type === "NOTE";

	// Extract title dynamically from editor content for notes, otherwise use document title
	const displayTitle = useMemo(() => {
		if (isNote && editorContent) {
			return extractTitleFromBlockNote(editorContent);
		}
		return document?.title || "Untitled";
	}, [isNote, editorContent, document?.title]);

	// Save and exit - DIRECT CALL TO FASTAPI
	// For new notes, create the note first, then save
	const handleSave = async () => {
		const token = getBearerToken();
		if (!token) {
			toast.error("Please login to save");
			redirectToLogin();
			return;
		}

		setSaving(true);
		setError(null);

		try {
			// If this is a new note, create it first
			if (isNewNote) {
				const title = extractTitleFromBlockNote(editorContent);

				// Create the note first
				const note = await notesApiService.createNote({
					search_space_id: searchSpaceId,
					title: title,
					blocknote_document: editorContent || undefined,
				});

				// If there's content, save it properly and trigger reindexing
				if (editorContent) {
					const response = await authenticatedFetch(
						`${process.env.NEXT_PUBLIC_FASTAPI_BACKEND_URL}/api/v1/search-spaces/${searchSpaceId}/documents/${note.id}/save`,
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ blocknote_document: editorContent }),
						}
					);

					if (!response.ok) {
						const errorData = await response
							.json()
							.catch(() => ({ detail: "Failed to save document" }));
						throw new Error(errorData.detail || "Failed to save document");
					}
				}

				setHasUnsavedChanges(false);
				toast.success("Note created successfully! Reindexing in background...");

				// Invalidate notes query to refresh the sidebar
				queryClient.invalidateQueries({
					queryKey: ["notes", String(searchSpaceId)],
				});

				// Update URL to reflect the new document ID without navigation
				window.history.replaceState({}, "", `/dashboard/${searchSpaceId}/editor/${note.id}`);
				// Update document state to reflect the new ID
				setDocument({
					document_id: note.id,
					title: title,
					document_type: "NOTE",
					blocknote_document: editorContent,
					updated_at: new Date().toISOString(),
				});
			} else {
				// Existing document - save normally
				if (!editorContent) {
					toast.error("No content to save");
					setSaving(false);
					return;
				}

				// Save blocknote_document and trigger reindexing in background
				const response = await authenticatedFetch(
					`${process.env.NEXT_PUBLIC_FASTAPI_BACKEND_URL}/api/v1/search-spaces/${searchSpaceId}/documents/${documentId}/save`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ blocknote_document: editorContent }),
					}
				);

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({ detail: "Failed to save document" }));
					throw new Error(errorData.detail || "Failed to save document");
				}

				setHasUnsavedChanges(false);
				toast.success("Document saved successfully! Reindexing in background...");

				// Invalidate notes query to refresh the sidebar
				if (document?.document_type === "NOTE") {
					queryClient.invalidateQueries({
						queryKey: ["notes", String(searchSpaceId)],
					});
				}
			}
		} catch (error) {
			console.error("Error saving document:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: isNewNote
						? "Failed to create note. Please try again."
						: "Failed to save document. Please try again.";
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setSaving(false);
		}
	};

	const handleBack = () => {
		if (hasUnsavedChanges) {
			setShowUnsavedDialog(true);
		} else {
			router.push(`/dashboard/${searchSpaceId}/new-chat`);
		}
	};

	const handleConfirmLeave = () => {
		setShowUnsavedDialog(false);
		// Clear global unsaved state
		setGlobalHasUnsavedChanges(false);
		setHasUnsavedChanges(false);

		// If there's a pending navigation (from sidebar), use that; otherwise go back to chat
		if (pendingNavigation) {
			router.push(pendingNavigation);
			setPendingNavigation(null);
		} else {
			router.push(`/dashboard/${searchSpaceId}/new-chat`);
		}
	};

	const handleCancelLeave = () => {
		setShowUnsavedDialog(false);
		// Clear pending navigation if user cancels
		setPendingNavigation(null);
	};

	return {
		document,
		loading,
		saving,
		editorContent,
		setEditorContent,
		error,
		hasUnsavedChanges,
		showUnsavedDialog,
		isNote,
		displayTitle,
		handleSave,
		handleBack,
		handleConfirmLeave,
		handleCancelLeave,
	};
}
