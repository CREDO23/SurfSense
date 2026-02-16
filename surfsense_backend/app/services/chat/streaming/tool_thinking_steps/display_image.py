from typing import Any


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
