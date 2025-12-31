import { AnimatePresence, motion } from "motion/react";
import { FileType, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/documents/file-type-config";

interface FileListProps {
	files: File[];
	isUploading: boolean;
	onRemoveFile: (index: number) => void;
}

export function FileList({ files, isUploading, onRemoveFile }: FileListProps) {
	return (
		<div className="space-y-3">
			<AnimatePresence mode="popLayout">
				{files.map((file, index) => (
					<motion.div
						key={`${file.name}-${index}`}
						layout
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 20 }}
						className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
					>
						<div className="flex items-center gap-3 flex-1 min-w-0">
							<FileType className="h-5 w-5 text-muted-foreground flex-shrink-0" />
							<div className="flex-1 min-w-0">
								<p className="text-sm sm:text-base font-medium truncate">{file.name}</p>
								<div className="flex items-center gap-2 mt-1">
									<Badge variant="secondary" className="text-xs">
										{formatFileSize(file.size)}
									</Badge>
									<Badge variant="outline" className="text-xs">
										{file.type || "Unknown type"}
									</Badge>
								</div>
							</div>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => onRemoveFile(index)}
							disabled={isUploading}
							className="h-8 w-8"
						>
							<X className="h-4 w-4" />
						</Button>
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
}
