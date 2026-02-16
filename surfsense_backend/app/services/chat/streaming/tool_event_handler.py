from collections.abc import AsyncGenerator
from typing import Any

from app.services.chat.streaming.stream_state import StreamState
from app.services.chat.streaming.tool_handlers import (
    build_display_image_end_step,
    build_display_image_start_step,
    build_generate_podcast_end_step,
    build_generate_podcast_start_step,
    build_generate_report_end_step,
    build_generate_report_start_step,
    build_link_preview_end_step,
    build_link_preview_start_step,
    build_ls_end_step,
    build_scrape_webpage_end_step,
    build_scrape_webpage_start_step,
    build_search_knowledge_base_end_step,
    build_search_knowledge_base_start_step,
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

# =============================================================================
# Thinking Step - Start
# =============================================================================


async def yield_thinking_step_start(
    tool_name: str,
    tool_input: Any,
    state: StreamState,
    step_id: str,
    streaming_service: VercelStreamingService,
) -> AsyncGenerator[str, None]:
    """Dispatch to appropriate thinking step builder and yield start event."""
    if tool_name == "search_knowledge_base":
        step_config = build_search_knowledge_base_start_step(tool_input)
    elif tool_name == "link_preview":
        step_config = build_link_preview_start_step(tool_input)
    elif tool_name == "display_image":
        step_config = build_display_image_start_step(tool_input)
    elif tool_name == "scrape_webpage":
        step_config = build_scrape_webpage_start_step(tool_input)
    elif tool_name == "generate_podcast":
        step_config = build_generate_podcast_start_step(tool_input)
    elif tool_name == "generate_report":
        step_config = build_generate_report_start_step(tool_input)
    else:
        step_config = {
            "title": f"Using {tool_name.replace('_', ' ')}",
            "items": [],
        }

    state.last_active_step_title = step_config["title"]
    state.last_active_step_items = step_config["items"]
    yield streaming_service.format_thinking_step(
        step_id=step_id,
        title=step_config["title"],
        status="in_progress",
        items=step_config["items"],
    )


# =============================================================================
# Thinking Step - End
# =============================================================================


async def yield_thinking_step_end(
    tool_name: str,
    tool_output: Any,
    state: StreamState,
    step_id: str,
    streaming_service: VercelStreamingService,
) -> AsyncGenerator[str, None]:
    """Dispatch to appropriate thinking step builder and yield end event."""
    if tool_name == "search_knowledge_base":
        step_config = build_search_knowledge_base_end_step(
            tool_output, state.last_active_step_items
        )
    elif tool_name == "link_preview":
        step_config = build_link_preview_end_step(
            tool_output, state.last_active_step_items
        )
    elif tool_name == "display_image":
        step_config = build_display_image_end_step(
            tool_output, state.last_active_step_items
        )
    elif tool_name == "scrape_webpage":
        step_config = build_scrape_webpage_end_step(
            tool_output, state.last_active_step_items
        )
    elif tool_name == "generate_podcast":
        step_config = build_generate_podcast_end_step(
            tool_output, state.last_active_step_items
        )
    elif tool_name == "generate_report":
        step_config = build_generate_report_end_step(
            tool_output, state.last_active_step_items
        )
    elif tool_name == "ls":
        step_config = build_ls_end_step(tool_output, state.last_active_step_items)
    else:
        step_config = {
            "title": f"Using {tool_name.replace('_', ' ')}",
            "items": state.last_active_step_items,
        }

    yield streaming_service.format_thinking_step(
        step_id=step_id,
        title=step_config["title"],
        status="completed",
        items=step_config["items"],
    )


# =============================================================================
# Tool Output
# =============================================================================


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
