from typing import Any


def build_search_knowledge_base_start_step(tool_input: Any) -> dict[str, Any]:
    """Build thinking step config for search_knowledge_base tool start."""
    query = (
        tool_input.get("query", "") if isinstance(tool_input, dict) else str(tool_input)
    )
    return {
        "title": "Searching knowledge base",
        "items": [f"Query: {query[:100]}{'...' if len(query) > 100 else ''}"],
    }


def build_search_knowledge_base_end_step(
    tool_output: Any, previous_items: list[str]
) -> dict[str, Any]:
    """Build thinking step config for search_knowledge_base tool end."""
    result_info = "Search completed"
    if isinstance(tool_output, dict):
        result_len = tool_output.get("result_length", 0)
        if result_len > 0:
            result_info = f"Found relevant information ({result_len} chars)"
    completed_items = [*previous_items, result_info]

    return {
        "title": "Searching knowledge base",
        "items": completed_items,
    }
