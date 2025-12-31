"use client";

import { AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { useParams } from "next/navigation";
import { BlockNoteEditor } from "@/components/DynamicBlockNoteEditor";
import { EditorLoadingState } from "@/components/editor/editor-loading-state";
import { EditorErrorState } from "@/components/editor/editor-error-state";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { UnsavedChangesDialog } from "@/components/editor/unsaved-changes-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useEditorState } from "@/hooks/use-editor-state";
import { FileText } from "lucide-react";

export default function EditorPage() {
	const params = useParams();
	const documentId = params.documentId as string;
	const searchSpaceId = Number(params.search_space_id);
	const isNewNote = documentId === "new";

	const {
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
	} = useEditorState({ documentId, searchSpaceId, isNewNote });

	if (loading) {
		return <EditorLoadingState />;
	}

	if (error) {
		return (
			<EditorErrorState
				error={error}
				searchSpaceId={searchSpaceId}
				onBack={() => window.location.href = `/dashboard/${searchSpaceId}/new-chat`}
			/>
		);
	}

	if (!document && !isNewNote) {
		return (
			<div className="flex items-center justify-center min-h-[400px] p-6">
				<Card className="w-full max-w-md">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<FileText className="h-12 w-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground">Document not found</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="flex flex-col h-svh w-full overflow-hidden"
		>
			{/* Toolbar */}
			<EditorToolbar
				displayTitle={displayTitle}
				hasUnsavedChanges={hasUnsavedChanges}
				saving={saving}
				isNewNote={isNewNote}
				onBack={handleBack}
				onSave={handleSave}
			/>

			{/* Editor Container */}
			<div className="flex-1 min-h-0 overflow-hidden relative">
				<div className="h-full w-full overflow-auto p-3 md:p-6">
					{error && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							className="mb-6 max-w-4xl mx-auto"
						>
							<div className="flex items-center gap-2 p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
								<AlertCircle className="h-5 w-5 shrink-0" />
								<p className="text-sm">{error}</p>
							</div>
						</motion.div>
					)}
					<div className="max-w-4xl mx-auto">
						<BlockNoteEditor
							key={documentId} // Force re-mount when document changes
							initialContent={isNewNote ? undefined : editorContent}
							onChange={setEditorContent}
							useTitleBlock={isNote}
						/>
					</div>
				</div>
			</div>

			{/* Unsaved Changes Dialog */}
			<UnsavedChangesDialog
				open={showUnsavedDialog}
				onConfirm={handleConfirmLeave}
				onCancel={handleCancelLeave}
			/>
		</motion.div>
	);
}
