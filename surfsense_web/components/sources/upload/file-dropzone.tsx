import { type DropzoneState } from "react-dropzone";
import { motion } from "motion/react";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GridPattern } from "../GridPattern";

interface FileDropzoneProps {
	getRootProps: ReturnType<DropzoneState["getRootProps"]>;
	getInputProps: ReturnType<DropzoneState["getInputProps"]>;
	isDragActive: boolean;
}

export function FileDropzone({ getRootProps, getInputProps, isDragActive }: FileDropzoneProps) {
	const t = useTranslations("upload_documents");

	return (
		<motion.div
			key="dropzone"
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{ duration: 0.2 }}
		>
			<div
				{...getRootProps()}
				className={`relative overflow-hidden rounded-xl border-2 border-dashed p-8 sm:p-12 transition-all cursor-pointer ${
					isDragActive
						? "border-primary bg-primary/5 scale-[0.99]"
						: "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/30"
				}`}
			>
				<GridPattern />
				<div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6">
					<motion.div
						animate={{
							scale: isDragActive ? 1.1 : 1,
							rotate: isDragActive ? 5 : 0,
						}}
						transition={{ duration: 0.2 }}
					>
						<div className="inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-primary/10">
							<Upload className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
						</div>
					</motion.div>
					<input {...getInputProps()} />
					<div className="space-y-2">
						<h3 className="text-lg sm:text-xl font-semibold">
							{isDragActive ? t("drop_files") : t("drag_drop")}
						</h3>
						<p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
							{t("or_click_to_select")}
						</p>
					</div>
					<Alert className="max-w-md mx-auto">
						<AlertDescription className="text-xs sm:text-sm text-center">
							{t("max_file_size")}
						</AlertDescription>
					</Alert>
				</div>
			</div>
		</motion.div>
	);
}
