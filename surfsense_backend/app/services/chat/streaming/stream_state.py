from typing import Any


class StreamState:
    """Manages state for the streaming event loop."""

    def __init__(
        self,
        step_prefix: str = "thinking",
        initial_step_id: str | None = None,
        initial_step_title: str = "",
        initial_step_items: list[str] | None = None,
    ):
        self.accumulated_text: str = ""
        self.current_text_id: str | None = None
        self.thinking_step_counter: int = 1 if initial_step_id else 0
        self.tool_step_ids: dict[str, str] = {}
        self.completed_step_ids: set[str] = set()
        self.last_active_step_id: str | None = initial_step_id
        self.last_active_step_title: str = initial_step_title
        self.last_active_step_items: list[str] = initial_step_items or []
        self.just_finished_tool: bool = False
        self.step_prefix: str = step_prefix

    def next_thinking_step_id(self) -> str:
        """Generate and return the next thinking step ID."""
        self.thinking_step_counter += 1
        return f"{self.step_prefix}-{self.thinking_step_counter}"

    def complete_current_step(self, streaming_service: Any) -> str | None:
        """Complete the current active step and return formatted event."""
        if (
            self.last_active_step_id
            and self.last_active_step_id not in self.completed_step_ids
        ):
            self.completed_step_ids.add(self.last_active_step_id)
            event = streaming_service.format_thinking_step(
                step_id=self.last_active_step_id,
                title=self.last_active_step_title,
                status="completed",
                items=self.last_active_step_items
                if self.last_active_step_items
                else None,
            )
            self.last_active_step_id = None
            return event
        return None

    def start_text_block(self, text_id: str) -> None:
        """Mark the start of a new text block."""
        self.current_text_id = text_id

    def end_text_block(self) -> None:
        """Mark the end of the current text block."""
        self.current_text_id = None

    def add_text(self, content: str) -> None:
        """Add content to accumulated text."""
        self.accumulated_text += content

    def clear_step_state_after_tool(self) -> None:
        """Clear step state after tool completion."""
        self.last_active_step_id = None
        self.last_active_step_title = ""
        self.last_active_step_items = []
        self.just_finished_tool = False

    def mark_tool_finished(self) -> None:
        """Mark that a tool has just finished."""
        self.just_finished_tool = True
        self.last_active_step_id = None
        self.last_active_step_title = ""
        self.last_active_step_items = []

    def register_tool_step(self, run_id: str, step_id: str) -> None:
        """Register a tool step ID for a given run ID."""
        self.tool_step_ids[run_id] = step_id

    def get_tool_step_id(self, run_id: str) -> str:
        """Get the step ID for a tool run, with fallback."""
        return self.tool_step_ids.get(
            run_id, f"{self.step_prefix}-unknown-{run_id[:8]}"
        )

    def mark_step_completed(self, step_id: str) -> None:
        """Mark a step as completed."""
        self.completed_step_ids.add(step_id)
