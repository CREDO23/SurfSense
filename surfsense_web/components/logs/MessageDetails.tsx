"use client";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MessageDetailsProps {
	message: string;
	taskName?: string;
	metadata?: any;
	createdAt?: string;
	children: React.ReactNode;
}

export function MessageDetails({
	message,
	taskName,
	metadata,
	createdAt,
	children,
}: MessageDetailsProps) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent className="max-w-3xl w-full">
				<div className="flex items-start justify-between gap-4">
					<div>
						<AlertDialogTitle className="text-lg">Log details</AlertDialogTitle>
						{createdAt && (
							<p className="text-xs text-muted-foreground mt-1">
								{new Date(createdAt).toLocaleString()}
							</p>
						)}
					</div>
					<div className="shrink-0">
						<AlertDialogCancel className="text-sm">Close</AlertDialogCancel>
					</div>
				</div>

				<div className="mt-4 space-y-4">
					{taskName && (
						<div className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded inline-block">
							{taskName}
						</div>
					)}

					<div className="bg-muted p-3 rounded max-h-[40vh] overflow-auto text-sm whitespace-pre-wrap">
						{message}
					</div>
				</div>

				<AlertDialogFooter />
			</AlertDialogContent>
		</AlertDialog>
	);
}
