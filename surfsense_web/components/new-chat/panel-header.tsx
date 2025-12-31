"use client";

import { ExternalLink, Loader2, X } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PanelHeaderProps {
	sourceType: string;
	title: string;
	description?: string;
	url?: string;
	isLoading?: boolean;
	onClose: () => void;
}

export function formatDocumentType(type: string) {
	if (!type) return "";
	return type
		.split("_")
		.map((word) => word.charAt(0) + word.slice(1).toLowerCase())
		.join(" ");
}

export function PanelHeader({
	sourceType,
	title,
	description,
	url,
	isLoading = false,
	onClose,
}: PanelHeaderProps) {
	return (
		<div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="flex items-start justify-between gap-4 p-6 lg:px-8">
				<div className="flex-1 min-w-0 space-y-3">
					{/* Source Type Badge */}
					<Badge
						variant="secondary"
						className="text-xs font-medium px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20"
					>
						{formatDocumentType(sourceType)}
					</Badge>

					{/* Title */}
					<div className="space-y-2">
						<h2 className="text-2xl font-bold tracking-tight line-clamp-2">{title}</h2>
						{description && (
							<p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
						)}
					</div>

					{/* URL */}
					{url && (
						<a
							href={url}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 text-sm text-primary hover:underline underline-offset-4"
						>
							<ExternalLink className="h-3.5 w-3.5" />
							<span className="truncate max-w-[300px]">{url}</span>
						</a>
					)}
				</div>

				{/* Close Button */}
				<Button
					variant="ghost"
					size="icon"
					className="flex-shrink-0 h-10 w-10 rounded-full hover:bg-accent"
					onClick={onClose}
					disabled={isLoading}
				>
					<X className="h-5 w-5" />
					<span className="sr-only">Close panel</span>
				</Button>
			</div>
		</div>
	);
}
