"""State tracking for streaming chat responses."""

from app.services.new_streaming_service import VercelStreamingService


class StreamStateTracker:
    """Tracks state across streaming events."""

    def __init__(self):
        # Track thinking steps for chain-of-thought display
        self.thinking_step_counter: int = 0
        # Map run_id -> step_id for tool calls so we can update them on completion
        self.tool_step_ids: dict[str, str] = {}
        # Track the last active step so we can mark it complete at the end
        self.last_active_step_id: str | None = None
        self.last_active_step_title: str = ""
        self.last_active_step_items: list[str] = []
        # Track which steps have been completed to avoid duplicate completions
        self.completed_step_ids: set[str] = set()
        # Track if we just finished a tool (text flows silently after tools)
        self.just_finished_tool: bool = False
        # Track write_todos calls to show "Creating plan" vs "Updating plan"
        self.write_todos_call_count: int = 0
        # Track the current text block for streaming
        self.current_text_id: str | None = None
        # Accumulated text
        self.accumulated_text: str = ""

    def next_thinking_step_id(self) -> str:
        """Generate next thinking step ID."""
        self.thinking_step_counter += 1
        return f"thinking-{self.thinking_step_counter}"

    def complete_current_step(
        self, streaming_service: VercelStreamingService
    ) -> str | None:
        """
        Complete the current active step and return the completion event, if any.
        
        Note: Does NOT complete "Synthesizing response" steps automatically,
        as these are reused after tool completions.
        """
        if (
            self.last_active_step_id
            and self.last_active_step_id not in self.completed_step_ids
        ):
            self.completed_step_ids.add(self.last_active_step_id)
            return streaming_service.format_thinking_step(
                step_id=self.last_active_step_id,
                title=self.last_active_step_title,
                status="completed",
                items=self.last_active_step_items if self.last_active_step_items else None,
            )
        return None

    def start_text_block(
        self, streaming_service: VercelStreamingService
    ) -> tuple[str, str]:
        """Start a new text block and return (text_start_event, text_id)."""
        self.current_text_id = streaming_service.generate_text_id()
        text_start = streaming_service.format_text_start(self.current_text_id)
        return text_start, self.current_text_id

    def end_text_block(self, streaming_service: VercelStreamingService) -> str | None:
        """End current text block if active."""
        if self.current_text_id is not None:
            text_end = streaming_service.format_text_end(self.current_text_id)
            self.current_text_id = None
            return text_end
        return None

    def reset_step_tracking(self):
        """Reset step tracking state (used after tool completion)."""
        self.last_active_step_id = None
        self.last_active_step_title = ""
        self.last_active_step_items = []
        self.just_finished_tool = False
