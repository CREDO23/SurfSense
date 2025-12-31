"""Format mentioned documents as context for the agent."""

from app.models import Document


def format_mentioned_documents_as_context(documents: list[Document]) -> str:
    """Format mentioned documents as context for the agent."""
    if not documents:
        return ""

    context_parts = ["<mentioned_documents>"]
    context_parts.append(
        "The user has explicitly mentioned the following documents from their knowledge base. "
        "These documents are directly relevant to the query and should be prioritized as primary sources."
    )
    for i, doc in enumerate(documents, 1):
        context_parts.append(
            f"<document index='{i}' id='{doc.id}' title='{doc.title}' type='{doc.document_type.value}'>"
        )
        context_parts.append(f"<![CDATA[{doc.content}]]>")
        context_parts.append("</document>")
    context_parts.append("</mentioned_documents>")

    return "\n".join(context_parts)
