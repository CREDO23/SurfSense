"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChatArchiveTabs } from "@/components/sidebar/chat-archive-tabs";
import { ChatEmptyStates } from "@/components/sidebar/chat-empty-states";
import { ChatSearchHeader } from "@/components/sidebar/chat-search-header";
import { ChatThreadItem } from "@/components/sidebar/chat-thread-item";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
	deleteThread,
	fetchThreads,
	searchThreads,
	type ThreadListItem,
	updateThread,
} from "@/lib/chat/thread-persistence";

interface AllChatsSidebarProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	searchSpaceId: string;
	onCloseMobileSidebar?: () => void;
}

export function AllChatsSidebar({
	open,
	onOpenChange,
	searchSpaceId,
	onCloseMobileSidebar,
}: AllChatsSidebarProps) {
	const t = useTranslations("sidebar");
	const router = useRouter();
	const params = useParams();
	const queryClient = useQueryClient();

	// Get the current chat ID from URL to check if user is deleting the currently open chat
	const currentChatId = Array.isArray(params.chat_id)
		? Number(params.chat_id[0])
		: params.chat_id
			? Number(params.chat_id)
			: null;
	const [deletingThreadId, setDeletingThreadId] = useState<number | null>(null);
	const [archivingThreadId, setArchivingThreadId] = useState<number | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [showArchived, setShowArchived] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
	const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

	const isSearchMode = !!debouncedSearchQuery.trim();

	// Handle mounting for portal
	useEffect(() => {
		setMounted(true);
	}, []);

	// Handle escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && open) {
				onOpenChange(false);
			}
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [open, onOpenChange]);

	// Lock body scroll when open
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

	// Fetch all threads (when not searching)
	const {
		data: threadsData,
		error: threadsError,
		isLoading: isLoadingThreads,
	} = useQuery({
		queryKey: ["all-threads", searchSpaceId],
		queryFn: () => fetchThreads(Number(searchSpaceId)),
		enabled: !!searchSpaceId && open && !isSearchMode,
	});

	// Search threads (when searching)
	const {
		data: searchData,
		error: searchError,
		isLoading: isLoadingSearch,
	} = useQuery({
		queryKey: ["search-threads", searchSpaceId, debouncedSearchQuery],
		queryFn: () => searchThreads(Number(searchSpaceId), debouncedSearchQuery.trim()),
		enabled: !!searchSpaceId && open && isSearchMode,
	});

	// Handle thread navigation
	const handleThreadClick = useCallback(
		(threadId: number) => {
			router.push(`/dashboard/${searchSpaceId}/new-chat/${threadId}`);
			onOpenChange(false);
			// Also close the main sidebar on mobile
			onCloseMobileSidebar?.();
		},
		[router, onOpenChange, searchSpaceId, onCloseMobileSidebar]
	);

	// Handle thread deletion
	const handleDeleteThread = useCallback(
		async (threadId: number) => {
			setDeletingThreadId(threadId);
			try {
				await deleteThread(threadId);
				toast.success(t("chat_deleted") || "Chat deleted successfully");
				queryClient.invalidateQueries({ queryKey: ["all-threads", searchSpaceId] });
				queryClient.invalidateQueries({ queryKey: ["search-threads", searchSpaceId] });
				queryClient.invalidateQueries({ queryKey: ["threads", searchSpaceId] });

				// If the deleted chat is currently open, close sidebar first then redirect
				if (currentChatId === threadId) {
					onOpenChange(false);
					// Wait for sidebar close animation to complete before navigating
					setTimeout(() => {
						router.push(`/dashboard/${searchSpaceId}/new-chat`);
					}, 250);
				}
			} catch (error) {
				console.error("Error deleting thread:", error);
				toast.error(t("error_deleting_chat") || "Failed to delete chat");
			} finally {
				setDeletingThreadId(null);
			}
		},
		[queryClient, searchSpaceId, t, currentChatId, router, onOpenChange]
	);

	// Handle thread archive/unarchive
	const handleToggleArchive = useCallback(
		async (threadId: number, currentlyArchived: boolean) => {
			setArchivingThreadId(threadId);
			try {
				await updateThread(threadId, { archived: !currentlyArchived });
				toast.success(
					currentlyArchived
						? t("chat_unarchived") || "Chat restored"
						: t("chat_archived") || "Chat archived"
				);
				queryClient.invalidateQueries({ queryKey: ["all-threads", searchSpaceId] });
				queryClient.invalidateQueries({ queryKey: ["search-threads", searchSpaceId] });
				queryClient.invalidateQueries({ queryKey: ["threads", searchSpaceId] });
			} catch (error) {
				console.error("Error archiving thread:", error);
				toast.error(t("error_archiving_chat") || "Failed to archive chat");
			} finally {
				setArchivingThreadId(null);
			}
		},
		[queryClient, searchSpaceId, t]
	);

	// Clear search
	const handleClearSearch = useCallback(() => {
		setSearchQuery("");
	}, []);

	// Determine which data source to use
	let threads: ThreadListItem[] = [];
	if (isSearchMode) {
		threads = searchData ?? [];
	} else if (threadsData) {
		threads = showArchived ? threadsData.archived_threads : threadsData.threads;
	}

	const isLoading = isSearchMode ? isLoadingSearch : isLoadingThreads;
	const error = isSearchMode ? searchError : threadsError;

	// Get counts for tabs
	const activeCount = threadsData?.threads.length ?? 0;
	const archivedCount = threadsData?.archived_threads.length ?? 0;

	if (!mounted) return null;

	return createPortal(
		<AnimatePresence>
			{open && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-[70] bg-black/50"
						onClick={() => onOpenChange(false)}
						aria-hidden="true"
					/>

					{/* Panel */}
					<motion.div
						initial={{ x: "-100%" }}
						animate={{ x: 0 }}
						exit={{ x: "-100%" }}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
						className="fixed inset-y-0 left-0 z-[70] w-80 bg-background shadow-xl flex flex-col pointer-events-auto isolate"
						role="dialog"
						aria-modal="true"
						aria-label={t("all_chats") || "All Chats"}
					>
						{/* Header */}
						<div className="flex-shrink-0 p-4 pb-2 space-y-3">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold">{t("all_chats") || "All Chats"}</h2>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 rounded-full"
									onClick={() => onOpenChange(false)}
								>
									<X className="h-4 w-4" />
									<span className="sr-only">Close</span>
								</Button>
							</div>

							<ChatSearchHeader
								searchQuery={searchQuery}
								onSearchChange={setSearchQuery}
								onClearSearch={handleClearSearch}
								placeholder={t("search_chats") || "Search chats..."}
								clearLabel={t("clear_search") || "Clear search"}
							/>
						</div>

						<ChatArchiveTabs
							showArchived={showArchived}
							onShowArchivedChange={setShowArchived}
							activeCount={activeCount}
							archivedCount={archivedCount}
							isSearchMode={isSearchMode}
						/>

						{/* Scrollable Content */}
						<div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
							{isLoading ? (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								</div>
							) : error ? (
								<div className="text-center py-8 text-sm text-destructive">
									{t("error_loading_chats") || "Error loading chats"}
								</div>
							) : threads.length > 0 ? (
								<div className="space-y-1">
									{threads.map((thread) => {
										const isDeleting = deletingThreadId === thread.id;
										const isArchiving = archivingThreadId === thread.id;
										const isActive = currentChatId === thread.id;

										return (
											<ChatThreadItem
												key={thread.id}
												thread={thread}
												isActive={isActive}
												isDeleting={isDeleting}
												isArchiving={isArchiving}
												onThreadClick={handleThreadClick}
												onDeleteThread={handleDeleteThread}
												onToggleArchive={handleToggleArchive}
												openDropdownId={openDropdownId}
												onOpenDropdownChange={setOpenDropdownId}
												updatedLabel={t("updated") || "Updated"}
												moreOptionsLabel={t("more_options") || "More options"}
												unarchiveLabel={t("unarchive") || "Restore"}
												archiveLabel={t("archive") || "Archive"}
												deleteLabel={t("delete") || "Delete"}
											/>
										);
									})}
								</div>
							) : (
								<ChatEmptyStates
									isSearchMode={isSearchMode}
									showArchived={showArchived}
									noChatsFoundLabel={t("no_chats_found") || "No chats found"}
									tryDifferentSearchLabel={t("try_different_search") || "Try a different search term"}
									noArchivedChatsLabel={t("no_archived_chats") || "No archived chats"}
									noChatsLabel={t("no_chats") || "No chats yet"}
									startNewChatHintLabel={
										t("start_new_chat_hint") || "Start a new chat from the chat page"
									}
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
