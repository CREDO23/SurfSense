from typing import Any


def normalize_tool_output(tool_output: Any) -> dict[str, Any]:
    """Convert any tool output to dict format."""
    if isinstance(tool_output, dict):
        return tool_output
    return {"result": tool_output}


def extract_error_message(
    tool_output: Any,
    default_error: str = "Unknown error",
) -> str:
    """Extract error message from tool output or return default."""
    if isinstance(tool_output, dict):
        return tool_output.get("error", default_error)
    return default_error


def build_tool_result(
    output: dict[str, Any],
    terminal_message: str | None = None,
    terminal_status: str | None = None,
) -> dict[str, Any]:
    """Build standard tool handler result structure."""
    return {
        "output": output,
        "terminal_message": terminal_message,
        "terminal_status": terminal_status,
    }
