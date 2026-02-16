from typing import Any

from app.services.chat.streaming.tool_output_formatters.helpers import (
    build_tool_result,
    extract_error_message,
    normalize_tool_output,
)


def format_podcast_generation_output(tool_output: Any) -> dict[str, Any]:
    output_data = normalize_tool_output(tool_output)

    if isinstance(tool_output, dict) and tool_output.get("status") == "success":
        terminal_message = (
            f"Podcast generated successfully: {tool_output.get('title', 'Podcast')}"
        )
        terminal_status = "success"
    else:
        error_msg = extract_error_message(tool_output)
        terminal_message = f"Podcast generation failed: {error_msg}"
        terminal_status = "error"

    return build_tool_result(output_data, terminal_message, terminal_status)


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


def format_scrape_webpage_output(tool_output: Any) -> dict[str, Any]:
    if isinstance(tool_output, dict):
        display_output = {k: v for k, v in tool_output.items() if k != "content"}
        if "content" in tool_output:
            content = tool_output.get("content", "")
            display_output["content_preview"] = (
                content[:500] + "..." if len(content) > 500 else content
            )
        output_data = display_output
    else:
        output_data = {"result": tool_output}

    if isinstance(tool_output, dict) and "error" not in tool_output:
        title = tool_output.get("title", "Webpage")
        word_count = tool_output.get("word_count", 0)
        terminal_message = f"Scraped: {title[:40]}{'...' if len(title) > 40 else ''} ({word_count:,} words)"
        terminal_status = "success"
    else:
        error_msg = extract_error_message(tool_output, "Failed to scrape")
        terminal_message = f"Scrape failed: {error_msg}"
        terminal_status = "error"

    return build_tool_result(output_data, terminal_message, terminal_status)


def format_search_knowledge_base_output(tool_output: Any) -> dict[str, Any]:
    return build_tool_result(
        output={"status": "completed", "result_length": len(str(tool_output))},
        terminal_message="Knowledge base search completed",
        terminal_status="success",
    )


def format_report_generation_output(tool_output: Any) -> dict[str, Any]:
    output_data = normalize_tool_output(tool_output)

    if isinstance(tool_output, dict) and tool_output.get("status") == "ready":
        word_count = tool_output.get("word_count", 0)
        terminal_message = f"Report generated: {tool_output.get('title', 'Report')} ({word_count:,} words)"
        terminal_status = "success"
    else:
        error_msg = extract_error_message(tool_output)
        terminal_message = f"Report generation failed: {error_msg}"
        terminal_status = "error"

    return build_tool_result(output_data, terminal_message, terminal_status)


def format_generic_tool_output(tool_output: Any, tool_name: str) -> dict[str, Any]:
    return build_tool_result(
        output={"status": "completed", "result_length": len(str(tool_output))},
        terminal_message=f"Tool {tool_name} completed",
        terminal_status="success",
    )
