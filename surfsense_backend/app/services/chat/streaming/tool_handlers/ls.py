from typing import Any

# =============================================================================
# Thinking Step - End
# =============================================================================


def build_ls_end_step(tool_output: Any, previous_items: list[str]) -> dict[str, Any]:
    """Build thinking step config for ls tool end."""
    if isinstance(tool_output, dict):
        ls_output = tool_output.get("result", "")
    elif isinstance(tool_output, str):
        ls_output = tool_output
    else:
        ls_output = str(tool_output) if tool_output else ""
    file_names: list[str] = []
    if ls_output:
        for line in ls_output.strip().split("\n"):
            line = line.strip()
            if line:
                name = line.rstrip("/").split("/")[-1]
                if name and len(name) <= 40:
                    file_names.append(name)
                elif name:
                    file_names.append(name[:37] + "...")
    if file_names:
        if len(file_names) <= 5:
            completed_items = [f"[{name}]" for name in file_names]
        else:
            completed_items = [f"[{name}]" for name in file_names[:4]]
            completed_items.append(f"(+{len(file_names) - 4} more)")
    else:
        completed_items = ["No files found"]

    return {
        "title": "Exploring files",
        "items": completed_items,
    }
