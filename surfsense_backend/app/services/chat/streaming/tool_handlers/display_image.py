from typing import Any

from app.services.chat.streaming.tool_handlers.helpers import (
    build_tool_result,
    normalize_tool_output,
)

# =============================================================================
# Thinking Step - Start
# =============================================================================


def build_display_image_start_step(tool_input: Any) -> dict[str, Any]:
    """Build thinking step config for display_image tool start."""
    src = tool_input.get("src", "") if isinstance(tool_input, dict) else str(tool_input)
    title = tool_input.get("title", "") if isinstance(tool_input, dict) else ""
    return {
        "title": "Analyzing the image",
        "items": [
            f"Analyzing: {title[:50] if title else src[:50]}{'...' if len(title or src) > 50 else ''}"
        ],
    }


# =============================================================================
# Thinking Step - End
# =============================================================================


def build_display_image_end_step(
    tool_output: Any, previous_items: list[str]
) -> dict[str, Any]:
    """Build thinking step config for display_image tool end."""
    if isinstance(tool_output, dict):
        title = tool_output.get("title", "")
        alt = tool_output.get("alt", "Image")
        display_name = title or alt
        completed_items = [
            *previous_items,
            f"Analyzed: {display_name[:50]}{'...' if len(display_name) > 50 else ''}",
        ]
    else:
        completed_items = [*previous_items, "Image analyzed"]

    return {
        "title": "Analyzing the image",
        "items": completed_items,
    }


# =============================================================================
# Output Formatting
# =============================================================================


def format_display_image_output(tool_output: Any) -> dict[str, Any]:
    output_data = normalize_tool_output(tool_output)

    terminal_message = None
    terminal_status = None
    if isinstance(tool_output, dict):
        title = tool_output.get("title") or tool_output.get("alt", "Image")
        terminal_message = (
            f"Image analyzed: {title[:40]}{'...' if len(title) > 40 else ''}"
        )
        terminal_status = "success"

    return build_tool_result(output_data, terminal_message, terminal_status)
