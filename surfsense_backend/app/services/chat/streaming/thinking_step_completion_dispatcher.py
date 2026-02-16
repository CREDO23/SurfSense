from collections.abc import AsyncGenerator
from typing import Any

from app.services.chat.streaming.stream_state import StreamState
from app.services.chat.streaming.tool_thinking_steps import (
    build_display_image_end_step,
    build_generate_podcast_end_step,
    build_generate_report_end_step,
    build_link_preview_end_step,
    build_ls_end_step,
    build_scrape_webpage_end_step,
    build_search_knowledge_base_end_step,
)
from app.services.new_streaming_service import VercelStreamingService


async def yield_thinking_step_completion(
    tool_name: str,
    tool_output: Any,
    state: StreamState,
    step_id: str,
    streaming_service: VercelStreamingService,
) -> AsyncGenerator[str, None]:
    """Dispatch to appropriate thinking step builder and yield completion event."""
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
