from typing import Any

from app.services.chat.streaming.tool_handlers.helpers import build_tool_result

# =============================================================================
# Output Formatting
# =============================================================================


def format_generic_tool_output(tool_output: Any, tool_name: str) -> dict[str, Any]:
    return build_tool_result(
        output={"status": "completed", "result_length": len(str(tool_output))},
        terminal_message=f"Tool {tool_name} completed",
        terminal_status="success",
    )
