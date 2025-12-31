"use client";

import { FileText } from "lucide-react";
import { motion } from "motion/react";

export interface DocumentMetadataProps {
	metadata: Record<string, unknown>;
	delay?: number;
}

export function DocumentMetadata({ metadata, delay = 0.1 }: DocumentMetadataProps) {
	if (!metadata || Object.keys(metadata).length === 0) {
		return null;
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay }}
			className="p-5 bg-muted/30 rounded-2xl border"
		>
			<h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
				<FileText className="h-4 w-4" />
				Document Information
			</h3>
			<dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
				{Object.entries(metadata).map(([key, value]) => (
					<div key={key} className="space-y-1">
						<dt className="font-medium text-muted-foreground capitalize text-xs">
							{key.replace(/_/g, " ")}
						</dt>
						<dd className="text-foreground wrap-break-word">{String(value)}</dd>
					</div>
				))}
			</dl>
		</motion.div>
	);
}
