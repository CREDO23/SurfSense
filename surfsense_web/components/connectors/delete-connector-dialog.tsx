"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConnectorDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	isDeleting: boolean;
	onConfirm: () => void;
}

export function DeleteConnectorDialog({
	open,
	onOpenChange,
	isDeleting,
	onConfirm,
}: DeleteConnectorDialogProps) {
	const t = useTranslations("connectors");
	const tCommon = useTranslations("common");

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("confirm_delete")}</AlertDialogTitle>
					<AlertDialogDescription>{t("delete_warning")}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>{tCommon("cancel")}</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
						{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{t("delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
