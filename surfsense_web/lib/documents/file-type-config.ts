const audioFileTypes = {
	"audio/mpeg": [".mp3", ".mpeg", ".mpga"],
	"audio/mp4": [".mp4", ".m4a"],
	"audio/wav": [".wav"],
	"audio/webm": [".webm"],
	"text/markdown": [".md", ".markdown"],
	"text/plain": [".txt"],
};

const llamaCloudFileTypes = {
	"application/pdf": [".pdf"],
	"application/msword": [".doc"],
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
	"application/vnd.ms-word.document.macroEnabled.12": [".docm"],
	"application/msword-template": [".dot"],
	"application/vnd.ms-word.template.macroEnabled.12": [".dotm"],
	"application/vnd.ms-powerpoint": [".ppt"],
	"application/vnd.ms-powerpoint.template.macroEnabled.12": [".pptm"],
	"application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
	"application/vnd.ms-powerpoint.template": [".pot"],
	"application/vnd.openxmlformats-officedocument.presentationml.template": [".potx"],
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
	"application/vnd.ms-excel": [".xls"],
	"application/vnd.ms-excel.sheet.macroEnabled.12": [".xlsm"],
	"application/vnd.ms-excel.sheet.binary.macroEnabled.12": [".xlsb"],
	"application/vnd.ms-excel.workspace": [".xlw"],
	"application/rtf": [".rtf"],
	"application/xml": [".xml"],
	"application/epub+zip": [".epub"],
	"text/csv": [".csv"],
	"text/tab-separated-values": [".tsv"],
	"text/html": [".html", ".htm", ".web"],
	"image/jpeg": [".jpg", ".jpeg"],
	"image/png": [".png"],
	"image/gif": [".gif"],
	"image/bmp": [".bmp"],
	"image/svg+xml": [".svg"],
	"image/tiff": [".tiff"],
	"image/webp": [".webp"],
	...audioFileTypes,
};

const doclingFileTypes = {
	"application/pdf": [".pdf"],
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
	"application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
	"text/asciidoc": [".adoc", ".asciidoc"],
	"text/html": [".html", ".htm", ".xhtml"],
	"text/csv": [".csv"],
	"image/png": [".png"],
	"image/jpeg": [".jpg", ".jpeg"],
	"image/tiff": [".tiff", ".tif"],
	"image/bmp": [".bmp"],
	"image/webp": [".webp"],
	...audioFileTypes,
};

const defaultFileTypes = {
	"image/bmp": [".bmp"],
	"text/csv": [".csv"],
	"application/msword": [".doc"],
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
	"message/rfc822": [".eml"],
	"application/epub+zip": [".epub"],
	"image/heic": [".heic"],
	"text/html": [".html"],
	"image/jpeg": [".jpeg", ".jpg"],
	"image/png": [".png"],
	"application/vnd.ms-outlook": [".msg"],
	"application/vnd.oasis.opendocument.text": [".odt"],
	"text/x-org": [".org"],
	"application/pkcs7-signature": [".p7s"],
	"application/pdf": [".pdf"],
	"application/vnd.ms-powerpoint": [".ppt"],
	"application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
	"text/x-rst": [".rst"],
	"application/rtf": [".rtf"],
	"image/tiff": [".tiff"],
	"text/tab-separated-values": [".tsv"],
	"application/vnd.ms-excel": [".xls"],
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
	"application/xml": [".xml"],
	...audioFileTypes,
};

export function getAcceptedFileTypes() {
	const etlService = process.env.NEXT_PUBLIC_ETL_SERVICE;

	if (etlService === "LLAMACLOUD") {
		return llamaCloudFileTypes;
	} else if (etlService === "DOCLING") {
		return doclingFileTypes;
	} else {
		return defaultFileTypes;
	}
}

export function getSupportedExtensions() {
	const acceptedFileTypes = getAcceptedFileTypes();
	return Array.from(new Set(Object.values(acceptedFileTypes).flat())).sort();
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
