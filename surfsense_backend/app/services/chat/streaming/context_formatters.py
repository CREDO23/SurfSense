import json

from app.db import Document, SurfsenseDocsDocument


def format_mentioned_documents_as_context(documents: list[Document]) -> str:
    """
    Format mentioned documents as context for the agent.

    Uses the same XML structure as knowledge_base.format_documents_for_context
    to ensure citations work properly with chunk IDs.
    """
    if not documents:
        return ""

    context_parts = ["<mentioned_documents>"]
    context_parts.append(
        "The user has explicitly mentioned the following documents from their knowledge base. "
        "These documents are directly relevant to the query and should be prioritized as primary sources. "
        "Use [citation:CHUNK_ID] format for citations (e.g., [citation:123])."
    )
    context_parts.append("")

    for doc in documents:
        metadata = doc.document_metadata or {}
        metadata_json = json.dumps(metadata, ensure_ascii=False)

        url = (
            metadata.get("url")
            or metadata.get("source")
            or metadata.get("page_url")
            or ""
        )

        context_parts.append("<document>")
        context_parts.append("<document_metadata>")
        context_parts.append(f"  <document_id>{doc.id}</document_id>")
        context_parts.append(
            f"  <document_type>{doc.document_type.value}</document_type>"
        )
        context_parts.append(f"  <title><![CDATA[{doc.title}]]></title>")
        context_parts.append(f"  <url><![CDATA[{url}]]></url>")
        context_parts.append(
            f"  <metadata_json><![CDATA[{metadata_json}]]></metadata_json>"
        )
        context_parts.append("</document_metadata>")
        context_parts.append("")
        context_parts.append("<document_content>")

        if hasattr(doc, "chunks") and doc.chunks:
            for chunk in doc.chunks:
                context_parts.append(
                    f"  <chunk id='{chunk.id}'><![CDATA[{chunk.content}]]></chunk>"
                )
        else:
            context_parts.append(
                f"  <chunk id='{doc.id}'><![CDATA[{doc.content}]]></chunk>"
            )

        context_parts.append("</document_content>")
        context_parts.append("</document>")
        context_parts.append("")

    context_parts.append("</mentioned_documents>")

    return "\n".join(context_parts)


def format_mentioned_surfsense_docs_as_context(
    documents: list[SurfsenseDocsDocument],
) -> str:
    """Format mentioned SurfSense documentation as context for the agent."""
    if not documents:
        return ""

    context_parts = ["<mentioned_surfsense_docs>"]
    context_parts.append(
        "The user has explicitly mentioned the following SurfSense documentation pages. "
        "These are official documentation about how to use SurfSense and should be used to answer questions about the application. "
        "Use [citation:CHUNK_ID] format for citations (e.g., [citation:doc-123])."
    )

    for doc in documents:
        metadata_json = json.dumps({"source": doc.source}, ensure_ascii=False)

        context_parts.append("<document>")
        context_parts.append("<document_metadata>")
        context_parts.append(f"  <document_id>doc-{doc.id}</document_id>")
        context_parts.append("  <document_type>SURFSENSE_DOCS</document_type>")
        context_parts.append(f"  <title><![CDATA[{doc.title}]]></title>")
        context_parts.append(f"  <url><![CDATA[{doc.source}]]></url>")
        context_parts.append(
            f"  <metadata_json><![CDATA[{metadata_json}]]></metadata_json>"
        )
        context_parts.append("</document_metadata>")
        context_parts.append("")
        context_parts.append("<document_content>")

        if hasattr(doc, "chunks") and doc.chunks:
            for chunk in doc.chunks:
                context_parts.append(
                    f"  <chunk id='doc-{chunk.id}'><![CDATA[{chunk.content}]]></chunk>"
                )
        else:
            context_parts.append(
                f"  <chunk id='doc-0'><![CDATA[{doc.content}]]></chunk>"
            )

        context_parts.append("</document_content>")
        context_parts.append("</document>")
        context_parts.append("")

    context_parts.append("</mentioned_surfsense_docs>")

    return "\n".join(context_parts)
