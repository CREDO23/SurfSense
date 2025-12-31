"use client";

import { useState, useContext } from "react";
import { MoreHorizontal } from "lucide-react";
import type { Row } from "@tanstack/react-table";
import { toast } from "sonner";
import type { Log } from "@/contracts/types/log.types";
import { JsonMetadataViewer } from "@/components/json-metadata-viewer";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LogRowActionsProps {
	row: Row<Log>;
	t: (key: string) => string;
	LogsContext: React.Context<any>;
}

export function LogRowActions({ row, t, LogsContext }: LogRowActionsProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const { deleteLog, refreshLogs } = useContext(LogsContext)!;
	const log = row.original;

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await deleteLog(log.id);
			await refreshLogs();
		} catch (error) {
			console.error("Error deleting log:", error);
			toast.error(t("log_deleted_error"));
		} finally {
			setIsDeleting(false);
			setIsOpen(false);
		}
	};

	return (
		<div className="flex justify-end">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="h-8 w-8 p-0">
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<JsonMetadataViewer
						title={`Log ${log.id} - Metadata`}
						metadata={log.log_metadata}
						trigger={
							<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
								{t("view_metadata")}
							</DropdownMenuItem>
						}
					/>
					<DropdownMenuSeparator />
					<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
						<AlertDialogTrigger asChild>
							<DropdownMenuItem
								className="text-destructive focus:text-destructive"
								onSelect={(e) => {
									e.preventDefault();
									setIsOpen(true);
								}}
							>
								{t("delete")}
							</DropdownMenuItem>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>{t("confirm_delete_log_title")}</AlertDialogTitle>
								<AlertDialogDescription>{t("confirm_delete_log_desc")}</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
								<AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
									{isDeleting ? t("deleting") : t("delete")}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
