from typing import Any

from app.services.chat.streaming.tool_handlers.helpers import (
    build_tool_result,
    extract_error_message,
    normalize_tool_output,
)

# =============================================================================
# Thinking Step - Start
# =============================================================================


def build_link_preview_start_step(tool_input: Any) -> dict[str, Any]:
    """Build thinking step config for link_preview tool start."""
    url = tool_input.get("url", "") if isinstance(tool_input, dict) else str(tool_input)
    return {
        "title": "Fetching link preview",
        "items": [f"URL: {url[:80]}{'...' if len(url) > 80 else ''}"],
    }


# =============================================================================
# Thinking Step - End
# =============================================================================


def build_link_preview_end_step(
    tool_output: Any, previous_items: list[str]
) -> dict[str, Any]:
    """Build thinking step config for link_preview tool end."""
    if isinstance(tool_output, dict):
        title = tool_output.get("title", "Link")
        domain = tool_output.get("domain", "")
        has_error = "error" in tool_output
        if has_error:
            completed_items = [
                *previous_items,
                f"Error: {tool_output.get('error', 'Failed to fetch')}",
            ]
        else:
            completed_items = [
                *previous_items,
                f"Title: {title[:60]}{'...' if len(title) > 60 else ''}",
                f"Domain: {domain}" if domain else "Preview loaded",
            ]
    else:
        completed_items = [*previous_items, "Preview loaded"]

    return {
        "title": "Fetching link preview",
        "items": completed_items,
    }


# =============================================================================
# Output Formatting
# =============================================================================


def format_link_preview_output(tool_output: Any) -> dict[str, Any]:
    output_data = normalize_tool_output(tool_output)

    if isinstance(tool_output, dict) and "error" not in tool_output:
        title = tool_output.get("title", "Link")
        terminal_message = (
            f"Link preview loaded: {title[:50]}{'...' if len(title) > 50 else ''}"
        )
        terminal_status = "success"
    else:
        error_msg = extract_error_message(tool_output, "Failed to fetch")
        terminal_message = f"Link preview failed: {error_msg}"
        terminal_status = "error"

    return build_tool_result(output_data, terminal_message, terminal_status)
