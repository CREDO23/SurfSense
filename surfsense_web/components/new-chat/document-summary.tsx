"use client";

import { BookOpen, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface DocumentSummaryProps {
	content: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	delay?: number;
}

export function DocumentSummary({ content, open, onOpenChange, delay = 0.15 }: DocumentSummaryProps) {
	if (!content) {
		return null;
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay }}
		>
			<Collapsible open={open} onOpenChange={onOpenChange}>
				<CollapsibleTrigger className="w-full flex items-center justify-between p-5 rounded-2xl bg-linear-to-r from-muted/50 to-muted/30 border hover:from-muted/70 hover:to-muted/50 transition-all duration-200">
					<span className="font-semibold flex items-center gap-2">
						<BookOpen className="h-4 w-4" />
						Document Summary
					</span>
					<motion.div
						animate={{ rotate: open ? 180 : 0 }}
						transition={{ duration: 0.2 }}
					>
						<ChevronDown className="h-5 w-5 text-muted-foreground" />
					</motion.div>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="mt-3 p-5 bg-muted/20 rounded-2xl border"
					>
						<MarkdownViewer content={content} />
					</motion.div>
				</CollapsibleContent>
			</Collapsible>
		</motion.div>
	);
}
