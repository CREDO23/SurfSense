"use client";

import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { uploadDocumentMutationAtom } from "@/atoms/documents/document-mutation.atoms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAcceptedFileTypes, getAudioFileTypes, formatFileSize } from "@/lib/documents/file-type-config";
import { FileDropzone } from "@/components/sources/upload/file-dropzone";
import { FileList } from "@/components/sources/upload/file-list";
import { UploadProgress } from "@/components/sources/upload/upload-progress";
import { SupportedTypesCard } from "@/components/sources/upload/supported-types-card";
import {
	trackDocumentUploadFailure,
	trackDocumentUploadStarted,
	trackDocumentUploadSuccess,
} from "@/lib/posthog/events";
import { GridPattern } from "./GridPattern";

interface DocumentUploadTabProps {
	searchSpaceId: string;
}

export function DocumentUploadTab({ searchSpaceId }: DocumentUploadTabProps) {
	const t = useTranslations("upload_documents");
	const router = useRouter();
	const [files, setFiles] = useState<File[]>([]);
	const [uploadProgress, setUploadProgress] = useState(0);

	const [uploadDocumentMutation] = useAtom(uploadDocumentMutationAtom);
	const { mutate: uploadDocuments, isPending: isUploading } = uploadDocumentMutation;

	const acceptedFileTypes = getAcceptedFileTypes();
	const supportedExtensions = Array.from(new Set(Object.values(acceptedFileTypes).flat())).sort();

	const onFilesAdded = (newFiles: File[]) => {
		setFiles((prevFiles) => [...prevFiles, ...newFiles]);
	};

	const removeFile = (index: number) => {
		setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
	};

	const getTotalFileSize = () => {
		return files.reduce((sum, file) => sum + file.size, 0);
	};

	const handleUpload = async () => {
		if (files.length === 0) return;

		const totalSize = getTotalFileSize();
		trackDocumentUploadStarted(searchSpaceId, files.length, totalSize);

		const progressInterval = setInterval(() => {
			setUploadProgress((prev) => {
				if (prev >= 90) return prev;
				return prev + Math.random() * 10;
			});
		}, 500);

		uploadDocuments(
			{
				searchSpaceId: Number.parseInt(searchSpaceId),
				files,
			},
			{
				onSuccess: () => {
					clearInterval(progressInterval);
					setUploadProgress(100);
					trackDocumentUploadSuccess(searchSpaceId, files.length, totalSize);

					setTimeout(() => {
						toast.success(t("upload_successful"));
						setFiles([]);
						setUploadProgress(0);
						router.push(`/dashboard/${searchSpaceId}/sources`);
					}, 500);
				},
				onError: (error) => {
					clearInterval(progressInterval);
					setUploadProgress(0);
					trackDocumentUploadFailure(searchSpaceId, files.length, totalSize, error.message);
					toast.error(t("upload_failed"), {
						description: error.message,
					});
				},
			}
		);
	};

	return (
		<div className="container mx-auto py-6 space-y-6 relative">
			<GridPattern />

			<Card className="relative z-10">
				<CardHeader>
					<CardTitle>{t("title")}</CardTitle>
					<CardDescription>{t("description")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<FileDropzone
						acceptedFileTypes={acceptedFileTypes}
						onFilesAdded={onFilesAdded}
						disabled={isUploading}
					/>

					{files.length > 0 && (
						<>
							<FileList
								files={files}
								onRemove={removeFile}
								isUploading={isUploading}
								formatFileSize={formatFileSize}
							/>

							{isUploading && <UploadProgress uploadProgress={uploadProgress} />}

							{!isUploading && (
								<div className="flex gap-3 justify-end pt-4">
									<Button variant="outline" onClick={() => setFiles([])}>
										{t("clear_all")}
									</Button>
									<Button onClick={handleUpload}>
										{t("upload_files", { count: files.length })}
									</Button>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			<SupportedTypesCard supportedExtensions={supportedExtensions} />
		</div>
	);
}
