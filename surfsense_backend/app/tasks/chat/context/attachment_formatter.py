"""Format chat attachments as context for the agent."""

from app.schemas.new_chat import ChatAttachment


def format_attachments_as_context(attachments: list[ChatAttachment]) -> str:
    """Format attachments as context for the agent."""
    if not attachments:
        return ""

    context_parts = ["<user_attachments>"]
    for i, attachment in enumerate(attachments, 1):
        context_parts.append(
            f"<attachment index='{i}' name='{attachment.name}' type='{attachment.type}'>"
        )
        context_parts.append(f"<![CDATA[{attachment.content}]]>")
        context_parts.append("</attachment>")
    context_parts.append("</user_attachments>")

    return "\n".join(context_parts)
