"""Attachment processing endpoint for new chat feature."""

import contextlib
import os
import tempfile

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import (
    Permission,
    SearchSpace,
    User,
    get_async_session,
)
from app.users import current_active_user
from app.utils.rbac import check_permission

router = APIRouter()
@router.post("/attachments/process")
async def process_attachment(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Process an attachment file and extract its content as markdown.

    This endpoint uses the configured ETL service to parse files and return
    the extracted content that can be used as context in chat messages.

    Supported file types depend on the configured ETL_SERVICE:
    - Markdown/Text files: .md, .markdown, .txt (always supported)
    - Audio files: .mp3, .mp4, .mpeg, .mpga, .m4a, .wav, .webm (if STT configured)
    - Documents: .pdf, .docx, .doc, .pptx, .xlsx (depends on ETL service)

    Returns:
        JSON with attachment id, name, type, and extracted content
    """
    from app.config import config as app_config

    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    filename = file.filename
    attachment_id = str(uuid.uuid4())

    try:
        # Save file to a temporary location
        file_ext = os.path.splitext(filename)[1].lower()
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            temp_path = temp_file.name
            content = await file.read()
            temp_file.write(content)

        extracted_content = ""

        # Process based on file type
        if file_ext in (".md", ".markdown", ".txt"):
            # For text/markdown files, read content directly
            with open(temp_path, encoding="utf-8") as f:
                extracted_content = f.read()

        elif file_ext in (".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm"):
            # Audio files - transcribe if STT service is configured
            if not app_config.STT_SERVICE:
                raise HTTPException(
                    status_code=422,
                    detail="Audio transcription is not configured. Please set STT_SERVICE.",
                )

            stt_service_type = (
                "local" if app_config.STT_SERVICE.startswith("local/") else "external"
            )

            if stt_service_type == "local":
                from app.services.stt_service import stt_service

                result = stt_service.transcribe_file(temp_path)
                extracted_content = result.get("text", "")
            else:
                from litellm import atranscription

                with open(temp_path, "rb") as audio_file:
                    transcription_kwargs = {
                        "model": app_config.STT_SERVICE,
                        "file": audio_file,
                        "api_key": app_config.STT_SERVICE_API_KEY,
                    }
                    if app_config.STT_SERVICE_API_BASE:
                        transcription_kwargs["api_base"] = (
                            app_config.STT_SERVICE_API_BASE
                        )

                    transcription_response = await atranscription(
                        **transcription_kwargs
                    )
                    extracted_content = transcription_response.get("text", "")

            if extracted_content:
                extracted_content = (
                    f"# Transcription of {filename}\n\n{extracted_content}"
                )

        else:
            # Document files - use configured ETL service
            if app_config.ETL_SERVICE == "UNSTRUCTURED":
                from langchain_unstructured import UnstructuredLoader

                from app.utils.document_converters import convert_document_to_markdown

                loader = UnstructuredLoader(
                    temp_path,
                    mode="elements",
                    post_processors=[],
                    languages=["eng"],
                    include_orig_elements=False,
                    include_metadata=False,
                    strategy="auto",
                )
                docs = await loader.aload()
                extracted_content = await convert_document_to_markdown(docs)

            elif app_config.ETL_SERVICE == "LLAMACLOUD":
                from llama_cloud_services import LlamaParse
                from llama_cloud_services.parse.utils import ResultType

                parser = LlamaParse(
                    api_key=app_config.LLAMA_CLOUD_API_KEY,
                    num_workers=1,
                    verbose=False,
                    language="en",
                    result_type=ResultType.MD,
                )
                result = await parser.aparse(temp_path)
                markdown_documents = await result.aget_markdown_documents(
                    split_by_page=False
                )

                if markdown_documents:
                    extracted_content = "\n\n".join(
                        doc.text for doc in markdown_documents
                    )

            elif app_config.ETL_SERVICE == "DOCLING":
                from app.services.docling_service import create_docling_service

                docling_service = create_docling_service()
                result = await docling_service.process_document(temp_path, filename)
                extracted_content = result.get("content", "")

            else:
                raise HTTPException(
                    status_code=422,
                    detail=f"ETL service not configured or unsupported file type: {file_ext}",
                )

        # Clean up temp file
        with contextlib.suppress(Exception):
            os.unlink(temp_path)

        if not extracted_content:
            raise HTTPException(
                status_code=422,
                detail=f"Could not extract content from file: {filename}",
            )

        # Determine attachment type (must be one of: "image", "document", "file")
        # assistant-ui only supports these three types
        if file_ext in (".png", ".jpg", ".jpeg", ".gif", ".webp"):
            attachment_type = "image"
        else:
            # All other files (including audio, documents, text) are treated as "document"
            attachment_type = "document"

        return {
            "id": attachment_id,
            "name": filename,
            "type": attachment_type,
            "content": extracted_content,
            "contentLength": len(extracted_content),
        }

    except HTTPException:
        raise
    except Exception as e:
        # Clean up temp file on error
        with contextlib.suppress(Exception):
            os.unlink(temp_path)

        raise HTTPException(
            status_code=500,
            detail=f"Failed to process attachment: {e!s}",
        ) from e
