from typing import Any

from app.services.chat.streaming.tool_handlers.helpers import (
    build_tool_result,
    extract_error_message,
)

# =============================================================================
# Thinking Step - Start
# =============================================================================


def build_scrape_webpage_start_step(tool_input: Any) -> dict[str, Any]:
    """Build thinking step config for scrape_webpage tool start."""
    url = tool_input.get("url", "") if isinstance(tool_input, dict) else str(tool_input)
    return {
        "title": "Scraping webpage",
        "items": [f"URL: {url[:80]}{'...' if len(url) > 80 else ''}"],
    }


# =============================================================================
# Thinking Step - End
# =============================================================================


def build_scrape_webpage_end_step(
    tool_output: Any, previous_items: list[str]
) -> dict[str, Any]:
    """Build thinking step config for scrape_webpage tool end."""
    if isinstance(tool_output, dict):
        title = tool_output.get("title", "Webpage")
        word_count = tool_output.get("word_count", 0)
        has_error = "error" in tool_output
        if has_error:
            completed_items = [
                *previous_items,
                f"Error: {tool_output.get('error', 'Failed to scrape')[:50]}",
            ]
        else:
            completed_items = [
                *previous_items,
                f"Title: {title[:50]}{'...' if len(title) > 50 else ''}",
                f"Extracted: {word_count:,} words",
            ]
    else:
        completed_items = [*previous_items, "Content extracted"]

    return {
        "title": "Scraping webpage",
        "items": completed_items,
    }


# =============================================================================
# Output Formatting
# =============================================================================


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
