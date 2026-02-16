import json
from typing import Any


def extract_content_from_chat_stream_event(event: dict[str, Any]) -> str | None:
    """Extract text content from chat model stream event."""
    chunk = event.get("data", {}).get("chunk")
    if chunk and hasattr(chunk, "content"):
        content = chunk.content
        if content and isinstance(content, str):
            return content
    return None


def extract_tool_info_from_start_event(
    event: dict[str, Any],
) -> tuple[str, str, dict[str, Any]]:
    """Extract tool information from tool_start event.

    Returns: (tool_name, run_id, tool_input)
    """
    tool_name = event.get("name", "unknown_tool")
    run_id = event.get("run_id", "")
    tool_input = event.get("data", {}).get("input", {})
    return tool_name, run_id, tool_input


def parse_tool_output_from_raw(raw_output: Any) -> dict[str, Any]:
    """Parse tool output from various formats into standardized dict."""
    if hasattr(raw_output, "content"):
        content = raw_output.content
        if isinstance(content, str):
            try:
                return json.loads(content)
            except (json.JSONDecodeError, TypeError):
                return {"result": content}
        elif isinstance(content, dict):
            return content
        else:
            return {"result": str(content)}
    elif isinstance(raw_output, dict):
        return raw_output
    else:
        return {"result": str(raw_output) if raw_output else "completed"}


def extract_tool_output_from_end_event(
    event: dict[str, Any],
) -> tuple[str, str, dict[str, Any]]:
    """Extract tool output information from tool_end event.

    Returns: (tool_name, run_id, tool_output)
    """
    run_id = event.get("run_id", "")
    tool_name = event.get("name", "unknown_tool")
    raw_output = event.get("data", {}).get("output", "")
    tool_output = parse_tool_output_from_raw(raw_output)
    return tool_name, run_id, tool_output
