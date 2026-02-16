from typing import Any


def build_scrape_webpage_start_step(tool_input: Any) -> dict[str, Any]:
    """Build thinking step config for scrape_webpage tool start."""
    url = tool_input.get("url", "") if isinstance(tool_input, dict) else str(tool_input)
    return {
        "title": "Scraping webpage",
        "items": [f"URL: {url[:80]}{'...' if len(url) > 80 else ''}"],
    }


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
