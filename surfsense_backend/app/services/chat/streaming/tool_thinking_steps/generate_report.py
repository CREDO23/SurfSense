from typing import Any


def build_generate_report_start_step(tool_input: Any) -> dict[str, Any]:
    """Build thinking step config for generate_report tool start."""
    report_topic = (
        tool_input.get("topic", "Report") if isinstance(tool_input, dict) else "Report"
    )
    report_style = (
        tool_input.get("report_style", "detailed")
        if isinstance(tool_input, dict)
        else "detailed"
    )
    content_len = len(
        tool_input.get("source_content", "") if isinstance(tool_input, dict) else ""
    )
    return {
        "title": "Generating report",
        "items": [
            f"Topic: {report_topic}",
            f"Style: {report_style}",
            f"Source content: {content_len:,} characters",
            "Generating report with LLM...",
        ],
    }


def build_generate_report_end_step(
    tool_output: Any, previous_items: list[str]
) -> dict[str, Any]:
    """Build thinking step config for generate_report tool end."""
    report_status = (
        tool_output.get("status", "unknown")
        if isinstance(tool_output, dict)
        else "unknown"
    )
    report_title = (
        tool_output.get("title", "Report")
        if isinstance(tool_output, dict)
        else "Report"
    )
    word_count = (
        tool_output.get("word_count", 0) if isinstance(tool_output, dict) else 0
    )

    if report_status == "ready":
        completed_items = [
            f"Title: {report_title}",
            f"Words: {word_count:,}",
            "Report generated successfully",
        ]
    elif report_status == "failed":
        error_msg = (
            tool_output.get("error", "Unknown error")
            if isinstance(tool_output, dict)
            else "Unknown error"
        )
        completed_items = [
            f"Title: {report_title}",
            f"Error: {error_msg[:50]}",
        ]
    else:
        completed_items = previous_items

    return {
        "title": "Generating report",
        "items": completed_items,
    }
