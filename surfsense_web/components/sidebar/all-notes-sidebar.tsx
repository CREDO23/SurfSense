"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { documentsApiService } from "@/lib/apis/documents-api.service";
import { notesApiService } from "@/lib/apis/notes-api.service";
import { NoteSearchHeader } from "@/components/sidebar/note-search-header";
import { NoteItem } from "@/components/sidebar/note-item";
import { NoteEmptyStates } from "@/components/sidebar/note-empty-states";

interface AllNotesSidebarProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	searchSpaceId: string;
	onAddNote?: () => void;
	onCloseMobileSidebar?: () => void;
}

export function AllNotesSidebar({
	open,
	onOpenChange,
	searchSpaceId,
	onAddNote,
	onCloseMobileSidebar,
}: AllNotesSidebarProps) {
	const t = useTranslations("sidebar");
	const router = useRouter();
	const params = useParams();
	const queryClient = useQueryClient();

	const currentNoteId = params.note_id ? Number(params.note_id) : null;
	const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [mounted, setMounted] = useState(false);
	const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && open) {
				onOpenChange(false);
			}
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [open, onOpenChange]);

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

	const {
		data: notesData,
		error: notesError,
		isLoading: isLoadingNotes,
	} = useQuery({
		queryKey: ["all-notes", searchSpaceId],
		queryFn: () =>
			notesApiService.getNotes({
				search_space_id: Number(searchSpaceId),
				page_size: 1000,
			}),
		enabled: !!searchSpaceId && open && !debouncedSearchQuery,
	});

	const {
		data: searchData,
		error: searchError,
		isLoading: isSearching,
	} = useQuery({
		queryKey: ["search-notes", searchSpaceId, debouncedSearchQuery],
		queryFn: () =>
			documentsApiService.searchDocuments({
				queryParams: {
					search_space_id: Number(searchSpaceId),
					document_types: ["NOTE"],
					title: debouncedSearchQuery,
					page_size: 100,
				},
			}),
		enabled: !!searchSpaceId && open && !!debouncedSearchQuery,
	});

	const handleNoteClick = useCallback(
		(noteId: number, noteSearchSpaceId: number) => {
			router.push(`/dashboard/${noteSearchSpaceId}/editor/${noteId}`);
			onOpenChange(false);
			onCloseMobileSidebar?.();
		},
		[router, onOpenChange, onCloseMobileSidebar]
	);

	const handleDeleteNote = useCallback(
		async (noteId: number, noteSearchSpaceId: number) => {
			setDeletingNoteId(noteId);
			try {
				await notesApiService.deleteNote({
					search_space_id: noteSearchSpaceId,
					note_id: noteId,
				});
				queryClient.invalidateQueries({ queryKey: ["all-notes", searchSpaceId] });
				queryClient.invalidateQueries({ queryKey: ["notes", searchSpaceId] });
				queryClient.invalidateQueries({ queryKey: ["search-notes", searchSpaceId] });
			} catch (error) {
				console.error("Error deleting note:", error);
			} finally {
				setDeletingNoteId(null);
			}
		},
		[queryClient, searchSpaceId]
	);

	const handleClearSearch = useCallback(() => {
		setSearchQuery("");
	}, []);

	const isSearchMode = !!debouncedSearchQuery;
	const isLoading = isSearchMode ? isSearching : isLoadingNotes;
	const error = isSearchMode ? searchError : notesError;

	const notes = useMemo(() => {
		let notesList: {
			id: number;
			title: string;
			search_space_id: number;
			created_at: string;
			updated_at?: string | null;
		}[];

		if (isSearchMode && searchData?.items) {
			notesList = searchData.items.map((doc) => ({
				id: doc.id,
				title: doc.title,
				search_space_id: doc.search_space_id,
				created_at: doc.created_at,
				updated_at: doc.updated_at,
			}));
		} else {
			notesList = notesData?.items ?? [];
		}

		return [...notesList].sort((a, b) => {
			const dateA = a.updated_at
				? new Date(a.updated_at).getTime()
				: new Date(a.created_at).getTime();
			const dateB = b.updated_at
				? new Date(b.updated_at).getTime()
				: new Date(b.created_at).getTime();
			return dateB - dateA;
		});
	}, [isSearchMode, searchData, notesData]);

	if (!mounted) return null;

	return createPortal(
		<AnimatePresence>
			{open && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-[70] bg-black/50"
						onClick={() => onOpenChange(false)}
						aria-hidden="true"
					/>

					<motion.div
						initial={{ x: "-100%" }}
						animate={{ x: 0 }}
						exit={{ x: "-100%" }}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
						className="fixed inset-y-0 left-0 z-[70] w-80 bg-background shadow-xl flex flex-col pointer-events-auto isolate"
						role="dialog"
						aria-modal="true"
						aria-label={t("all_notes") || "All Notes"}
					>
						<NoteSearchHeader
							title={t("all_notes") || "All Notes"}
							searchPlaceholder={t("search_notes") || "Search notes..."}
							searchValue={searchQuery}
							onSearchChange={setSearchQuery}
							onClearSearch={handleClearSearch}
							onClose={() => onOpenChange(false)}
						/>

						<div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
							{isLoading ? (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								</div>
							) : error ? (
								<div className="text-center py-8 text-sm text-destructive">
									{t("error_loading_notes") || "Error loading notes"}
								</div>
							) : notes.length > 0 ? (
								<div className="space-y-1">
									{notes.map((note) => (
										<NoteItem
											key={note.id}
											note={note}
											isActive={currentNoteId === note.id}
											isDeleting={deletingNoteId === note.id}
											onClick={handleNoteClick}
											onDelete={handleDeleteNote}
											t={t}
										/>
									))}
								</div>
							) : (
								<NoteEmptyStates
									isSearchMode={isSearchMode}
									onAddNote={onAddNote}
									onClosePanel={() => onOpenChange(false)}
									t={t}
								/>
							)}
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>,
		document.body
	);
}
