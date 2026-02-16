from collections.abc import AsyncGenerator
from typing import Any

from app.services.chat.streaming.tool_output_formatters import (
    format_display_image_output,
    format_generic_tool_output,
    format_link_preview_output,
    format_notion_tool_output,
    format_podcast_generation_output,
    format_report_generation_output,
    format_scrape_webpage_output,
    format_search_knowledge_base_output,
)
from app.services.new_streaming_service import VercelStreamingService


async def yield_tool_output_events(
    tool_name: str,
    tool_output: Any,
    tool_call_id: str,
    streaming_service: VercelStreamingService,
) -> AsyncGenerator[str, None]:
    """Dispatch to appropriate output formatter and yield SSE events."""
    if tool_name == "generate_podcast":
        result = format_podcast_generation_output(tool_output)
    elif tool_name == "link_preview":
        result = format_link_preview_output(tool_output)
    elif tool_name == "display_image":
        result = format_display_image_output(tool_output)
    elif tool_name == "scrape_webpage":
        result = format_scrape_webpage_output(tool_output)
    elif tool_name == "search_knowledge_base":
        result = format_search_knowledge_base_output(tool_output)
    elif tool_name == "generate_report":
        result = format_report_generation_output(tool_output)
    elif tool_name in (
        "create_notion_page",
        "update_notion_page",
        "delete_notion_page",
    ):
        result = format_notion_tool_output(tool_output)
    else:
        result = format_generic_tool_output(tool_output, tool_name)

    yield streaming_service.format_tool_output_available(tool_call_id, result["output"])
    if result["terminal_message"]:
        yield streaming_service.format_terminal_info(
            result["terminal_message"], result["terminal_status"]
        )
