import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface UploadProgressProps {
	uploadProgress: number;
}

export function UploadProgress({ uploadProgress }: UploadProgressProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="mt-6 space-y-3"
		>
			<Separator />
			<div className="flex items-center gap-3">
				{uploadProgress < 100 ? (
					<Loader2 className="h-5 w-5 animate-spin text-primary" />
				) : (
					<CheckCircle2 className="h-5 w-5 text-green-500" />
				)}
				<div className="flex-1">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium">
							{uploadProgress < 100 ? "Uploading..." : "Upload complete!"}
						</span>
						<span className="text-sm text-muted-foreground">{uploadProgress}%</span>
					</div>
					<Progress value={uploadProgress} className="h-2" />
				</div>
			</div>
		</motion.div>
	);
}
