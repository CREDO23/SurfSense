from typing import Any


def build_generate_podcast_start_step(tool_input: Any) -> dict[str, Any]:
    """Build thinking step config for generate_podcast tool start."""
    podcast_title = (
        tool_input.get("podcast_title", "SurfSense Podcast")
        if isinstance(tool_input, dict)
        else "SurfSense Podcast"
    )
    content_len = len(
        tool_input.get("source_content", "") if isinstance(tool_input, dict) else ""
    )
    return {
        "title": "Generating podcast",
        "items": [
            f"Title: {podcast_title}",
            f"Content: {content_len:,} characters",
            "Preparing audio generation...",
        ],
    }


def build_generate_podcast_end_step(
    tool_output: Any, previous_items: list[str]
) -> dict[str, Any]:
    """Build thinking step config for generate_podcast tool end."""
    podcast_status = (
        tool_output.get("status", "unknown")
        if isinstance(tool_output, dict)
        else "unknown"
    )
    podcast_title = (
        tool_output.get("title", "Podcast")
        if isinstance(tool_output, dict)
        else "Podcast"
    )
    if podcast_status == "processing":
        completed_items = [
            f"Title: {podcast_title}",
            "Audio generation started",
            "Processing in background...",
        ]
    elif podcast_status == "already_generating":
        completed_items = [
            f"Title: {podcast_title}",
            "Podcast already in progress",
            "Please wait for it to complete",
        ]
    elif podcast_status == "error":
        error_msg = (
            tool_output.get("error", "Unknown error")
            if isinstance(tool_output, dict)
            else "Unknown error"
        )
        completed_items = [
            f"Title: {podcast_title}",
            f"Error: {error_msg[:50]}",
        ]
    else:
        completed_items = previous_items

    return {
        "title": "Generating podcast",
        "items": completed_items,
    }
