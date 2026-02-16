from typing import Any

from app.services.chat.streaming.tool_output_formatters.helpers import (
    build_tool_result,
    normalize_tool_output,
)


def format_notion_tool_output(tool_output: Any) -> dict[str, Any]:
    output_data = normalize_tool_output(tool_output)
    return build_tool_result(output_data, terminal_message=None, terminal_status=None)
