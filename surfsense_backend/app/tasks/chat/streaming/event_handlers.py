"""
Event handlers for streaming chat events.

This module contains handlers for the three main event types:
- on_chat_model_stream: Text streaming from LLM
- on_tool_start: Tool invocation start events
- on_tool_end: Tool completion events with results
"""

import json
import logging
from collections.abc import AsyncGenerator

from app.services.new_streaming_service import VercelStreamingService
from app.tasks.chat.context import extract_todos_from_deepagents
from app.tasks.chat.streaming.state_tracker import StreamStateTracker

logger = logging.getLogger(__name__)


async def handle_chat_model_stream(
    event: dict,
    state: StreamStateTracker,
    streaming_service: VercelStreamingService,
) -> AsyncGenerator[str, None]:
    """Handle on_chat_model_stream events for text streaming."""
    chunk = event.get("data", {}).get("chunk")
    if chunk and hasattr(chunk, "content"):
        content = chunk.content
        if content and isinstance(content, str):
            # Start a new text block if needed
            if state.current_text_id is None:
                # Complete any previous step
                completion_event = state.complete_current_step(streaming_service)
                if completion_event:
                    yield completion_event

                if state.just_finished_tool:
                    # Clear the active step tracking - text flows without a dedicated step
                    state.reset_step_tracking()

                state.current_text_id = streaming_service.generate_text_id()
                yield streaming_service.format_text_start(state.current_text_id)

            # Stream the text delta
            yield streaming_service.format_text_delta(state.current_text_id, content)
            state.accumulated_text += content


async def handle_tool_start(
    event: dict,
    state: StreamStateTracker,
    streaming_service: VercelStreamingService,
) -> AsyncGenerator[str, None]:
    """Handle on_tool_start events for tool invocations."""
    tool_name = event.get("name", "unknown_tool")
    run_id = event.get("run_id", "")
    tool_input = event.get("data", {}).get("input", {})

    # End current text block if any
    if state.current_text_id is not None:
        yield streaming_service.format_text_end(state.current_text_id)
        state.current_text_id = None

    # Complete any previous step EXCEPT "Synthesizing response"
    # (we want to reuse the Synthesizing step after tools complete)
    if state.last_active_step_title != "Synthesizing response":
        completion_event = state.complete_current_step(streaming_service)
        if completion_event:
            yield completion_event

    # Reset the just_finished_tool flag since we're starting a new tool
    state.just_finished_tool = False

    # Create thinking step for the tool call and store it for later update
    tool_step_id = state.next_thinking_step_id()
    state.tool_step_ids[run_id] = tool_step_id
    state.last_active_step_id = tool_step_id

    # Tool-specific step creation
    if tool_name == "search_knowledge_base":
        query = (
            tool_input.get("query", "")
            if isinstance(tool_input, dict)
            else str(tool_input)
        )
        state.last_active_step_title = "Searching knowledge base"
        state.last_active_step_items = [
            f"Query: {query[:100]}{'...' if len(query) > 100 else ''}"
        ]
        yield streaming_service.format_thinking_step(
            step_id=tool_step_id,
            title="Searching knowledge base",
            status="in_progress",
            items=state.last_active_step_items,
        )
    elif tool_name == "link_preview":
        url = (
            tool_input.get("url", "")
            if isinstance(tool_input, dict)
            else str(tool_input)
        )
        state.last_active_step_title = "Fetching link preview"
        state.last_active_step_items = [
            f"URL: {url[:80]}{'...' if len(url) > 80 else ''}"
        ]
        yield streaming_service.format_thinking_step(
            step_id=tool_step_id,
            title="Fetching link preview",
            status="in_progress",
            items=state.last_active_step_items,
        )
    elif tool_name == "display_image":
        src = (
            tool_input.get("src", "")
            if isinstance(tool_input, dict)
            else str(tool_input)
        )
        title = (
            tool_input.get("title", "")
            if isinstance(tool_input, dict)
            else ""
        )
        state.last_active_step_title = "Analyzing the image"
        state.last_active_step_items = [
            f"Analyzing: {title[:50] if title else src[:50]}{'...' if len(title or src) > 50 else ''}"
        ]
        yield streaming_service.format_thinking_step(
            step_id=tool_step_id,
            title="Analyzing the image",
            status="in_progress",
            items=state.last_active_step_items,
        )
    elif tool_name == "scrape_webpage":
        url = (
            tool_input.get("url", "")
            if isinstance(tool_input, dict)
            else str(tool_input)
        )
        state.last_active_step_title = "Scraping webpage"
        state.last_active_step_items = [
            f"URL: {url[:80]}{'...' if len(url) > 80 else ''}"
        ]
        yield streaming_service.format_thinking_step(
            step_id=tool_step_id,
            title="Scraping webpage",
            status="in_progress",
            items=state.last_active_step_items,
        )
    elif tool_name == "write_todos":
        # Track write_todos calls for better messaging
        state.write_todos_call_count += 1
        if state.write_todos_call_count == 1:
            # First call - creating plan
            state.last_active_step_title = "Creating plan"
            state.last_active_step_items = ["Breaking down into actionable steps"]
            yield streaming_service.format_thinking_step(
                step_id=tool_step_id,
                title="Creating plan",
                status="in_progress",
                items=state.last_active_step_items,
            )
        else:
            # Subsequent calls - updating progress
            state.last_active_step_title = "Updating progress"
            state.last_active_step_items = ["Marking completed tasks"]
            yield streaming_service.format_thinking_step(
                step_id=tool_step_id,
                title="Updating progress",
                status="in_progress",
                items=state.last_active_step_items,
            )
    elif tool_name == "generate_podcast":
        podcast_input = tool_input if isinstance(tool_input, dict) else {}
        title = podcast_input.get("title", "Untitled Podcast")
        state.last_active_step_title = "Generating podcast"
        state.last_active_step_items = [f"Title: {title[:50]}{'...' if len(title) > 50 else ''}"]
        yield streaming_service.format_thinking_step(
            step_id=tool_step_id,
            title="Generating podcast",
            status="in_progress",
            items=state.last_active_step_items,
        )
    else:
        # Generic tool
        state.last_active_step_title = f"Using {tool_name.replace('_', ' ')}"
        state.last_active_step_items = []
        yield streaming_service.format_thinking_step(
            step_id=tool_step_id,
            title=state.last_active_step_title,
            status="in_progress",
        )

    # Stream tool info
    tool_call_id = (
        f"call_{run_id[:32]}"
        if run_id
        else streaming_service.generate_tool_call_id()
    )
    yield streaming_service.format_tool_input_start(tool_call_id, tool_name)
    yield streaming_service.format_tool_input_available(
        tool_call_id,
        tool_name,
        tool_input
        if isinstance(tool_input, dict)
        else {"input": tool_input},
    )


async def handle_tool_end(
    event: dict,
    state: StreamStateTracker,
    streaming_service: VercelStreamingService,
) -> AsyncGenerator[str, None]:
    """Handle on_tool_end events for tool completion."""
    run_id = event.get("run_id", "")
    tool_name = event.get("name", "unknown_tool")
    raw_output = event.get("data", {}).get("output", "")

    # Handle deepagents' write_todos Command object specially
    if tool_name == "write_todos" and hasattr(raw_output, "update"):
        # deepagents returns a Command object - extract todos directly
        tool_output = extract_todos_from_deepagents(raw_output)
    elif hasattr(raw_output, "content"):
        # It's a ToolMessage object - extract the content
        content = raw_output.content
        # If content is a string that looks like JSON, try to parse it
        if isinstance(content, str):
            try:
                tool_output = json.loads(content)
            except (json.JSONDecodeError, TypeError):
                tool_output = {"result": content}
        elif isinstance(content, dict):
            tool_output = content
        else:
            tool_output = {"result": str(content)}
    elif isinstance(raw_output, dict):
        tool_output = raw_output
    else:
        tool_output = {
            "result": str(raw_output) if raw_output else "completed"
        }

    tool_call_id = f"call_{run_id[:32]}" if run_id else "call_unknown"

    # Get the original tool step ID to update it (not create a new one)
    original_step_id = state.tool_step_ids.get(
        run_id, f"thinking-unknown-{run_id[:8]}"
    )

    # Mark the tool thinking step as completed using the SAME step ID
    # Also add to completed set so we don't try to complete it again
    state.completed_step_ids.add(original_step_id)

    # Tool-specific completion step formatting
    if tool_name == "search_knowledge_base":
        # Get result count if available
        result_info = "Search completed"
        if isinstance(tool_output, dict):
            result_len = tool_output.get("result_length", 0)
            if result_len > 0:
                result_info = (
                    f"Found relevant information ({result_len} chars)"
                )
        # Include original query in completed items
        completed_items = [*state.last_active_step_items, result_info]
        yield streaming_service.format_thinking_step(
            step_id=original_step_id,
            title="Searching knowledge base",
            status="completed",
            items=completed_items,
        )
    elif tool_name == "link_preview":
        # Build completion items based on link preview result
        if isinstance(tool_output, dict):
            title = tool_output.get("title", "Link")
            domain = tool_output.get("domain", "")
            has_error = "error" in tool_output
            if has_error:
                completed_items = [
                    *state.last_active_step_items,
                    f"Error: {tool_output.get('error', 'Failed to fetch')}",
                ]
            else:
                completed_items = [
                    *state.last_active_step_items,
                    f"Title: {title[:60]}{'...' if len(title) > 60 else ''}",
                    f"Domain: {domain}" if domain else "Preview loaded",
                ]
        else:
            completed_items = [*state.last_active_step_items, "Preview loaded"]
        yield streaming_service.format_thinking_step(
            step_id=original_step_id,
            title="Fetching link preview",
            status="completed",
            items=completed_items,
        )
    elif tool_name == "display_image":
        # Build completion items for image analysis
        if isinstance(tool_output, dict):
            title = tool_output.get("title", "")
            alt = tool_output.get("alt", "Image")
            display_name = title or alt
            completed_items = [
                *state.last_active_step_items,
                f"Analyzed: {display_name[:50]}{'...' if len(display_name) > 50 else ''}",
            ]
        else:
            completed_items = [*state.last_active_step_items, "Image analyzed"]
        yield streaming_service.format_thinking_step(
            step_id=original_step_id,
            title="Analyzing the image",
            status="completed",
            items=completed_items,
        )
    elif tool_name == "scrape_webpage":
        # Build completion items for webpage scraping
        if isinstance(tool_output, dict):
            title = tool_output.get("title", "Webpage")
            word_count = tool_output.get("word_count", 0)
            has_error = "error" in tool_output
            if has_error:
                completed_items = [
                    *state.last_active_step_items,
                    f"Error: {tool_output.get('error', 'Failed to scrape')}",
                ]
            else:
                completed_items = [
                    *state.last_active_step_items,
                    f"Title: {title[:50]}{'...' if len(title) > 50 else ''}",
                    f"Content: {word_count:,} words",
                ]
        else:
            completed_items = [*state.last_active_step_items, "Scraping completed"]
        yield streaming_service.format_thinking_step(
            step_id=original_step_id,
            title="Scraping webpage",
            status="completed",
            items=completed_items,
        )
    elif tool_name == "generate_podcast":
        # Build completion items for podcast generation
        if isinstance(tool_output, dict):
            podcast_title = tool_output.get("title", "Podcast")
            has_error = "error" in tool_output
            if has_error:
                error_msg = (
                    tool_output.get("error", "Unknown error")
                    if isinstance(tool_output, dict)
                    else "Unknown error"
                )
                completed_items = [
                    f"Title: {podcast_title}",
                    f"Error: {error_msg[:50]}",
                ]
            else:
                completed_items = state.last_active_step_items
        else:
            completed_items = state.last_active_step_items

        yield streaming_service.format_thinking_step(
            step_id=original_step_id,
            title="Generating podcast",
            status="completed",
            items=completed_items,
        )
    elif tool_name == "write_todos":
        # Build completion items for planning/updating
        if isinstance(tool_output, dict):
            todos = tool_output.get("todos", [])
            todo_count = len(todos) if isinstance(todos, list) else 0
            completed_count = (
                sum(
                    1
                    for t in todos
                    if isinstance(t, dict)
                    and t.get("status") == "completed"
                )
                if isinstance(todos, list)
                else 0
            )
            in_progress_count = (
                sum(
                    1
                    for t in todos
                    if isinstance(t, dict)
                    and t.get("status") == "in_progress"
                )
                if isinstance(todos, list)
                else 0
            )

            # Use context-aware completion message
            if state.last_active_step_title == "Creating plan":
                completed_items = [f"Created {todo_count} tasks"]
            else:
                # Updating progress - show stats
                completed_items = [
                    f"Progress: {completed_count}/{todo_count} completed",
                ]
                if in_progress_count > 0:
                    # Find the currently in-progress task name
                    in_progress_task = next(
                        (
                            t.get("content", "")[:40]
                            for t in todos
                            if isinstance(t, dict)
                            and t.get("status") == "in_progress"
                        ),
                        None,
                    )
                    if in_progress_task:
                        completed_items.append(
                            f"Current: {in_progress_task}..."
                        )
        else:
            completed_items = ["Plan updated"]
        yield streaming_service.format_thinking_step(
            step_id=original_step_id,
            title=state.last_active_step_title,
            status="completed",
            items=completed_items,
        )
    elif tool_name == "ls":
        # Build completion items showing file names found
        if isinstance(tool_output, dict):
            result = tool_output.get("result", "")
        elif isinstance(tool_output, str):
            result = tool_output
        else:
            result = str(tool_output) if tool_output else ""

        # Parse file paths and extract just the file names
        file_names = []
        if result:
            # The ls tool returns paths, extract just the file/folder names
            for line in result.strip().split("\n"):
                line = line.strip()
                if line:
                    # Get just the filename from the path
                    name = line.rstrip("/").split("/")[-1]
                    if name and len(name) <= 40:
                        file_names.append(name)
                    elif name:
                        file_names.append(name[:37] + "...")

        # Build display items - wrap file names in brackets for icon rendering
        if file_names:
            if len(file_names) <= 5:
                # Wrap each file name in brackets for styled tile rendering
                completed_items = [f"[{name}]" for name in file_names]
            else:
                # Show first few with brackets and count
                completed_items = [f"[{name}]" for name in file_names[:4]]
                completed_items.append(f"(+{len(file_names) - 4} more)")
        else:
            completed_items = ["No files found"]

        yield streaming_service.format_thinking_step(
            step_id=original_step_id,
            title="Exploring files",
            status="completed",
            items=completed_items,
        )
    else:
        # Generic tool completion
        yield streaming_service.format_thinking_step(
            step_id=original_step_id,
            title=state.last_active_step_title,
            status="completed",
        )

    # Set just_finished_tool flag so the next text block knows to handle this state
    state.just_finished_tool = True

    # Now stream the tool output to the frontend
    # Tool-specific output formatting
    if tool_name == "search_knowledge_base":
        # Send simple terminal message for search
        if isinstance(tool_output, dict):
            result_len = tool_output.get("result_length", 0)
            if result_len > 0:
                yield streaming_service.format_terminal_info(
                    f"Found relevant information ({result_len} chars)",
                    "success",
                )
        # Don't stream the full search result - let the LLM use it internally
        yield streaming_service.format_tool_output_available(
            tool_call_id,
            {"result": "Search completed"},
        )
    elif tool_name == "write_todos":
        # Stream the full todos object so frontend can render the TodosCard
        yield streaming_service.format_tool_output_available(
            tool_call_id,
            tool_output if isinstance(tool_output, dict) else {"todos": []},
        )
        # Send appropriate terminal message
        if isinstance(tool_output, dict):
            todos = tool_output.get("todos", [])
            todo_count = len(todos) if isinstance(todos, list) else 0
            if state.write_todos_call_count == 1:
                yield streaming_service.format_terminal_info(
                    f"Created plan with {todo_count} tasks",
                    "success",
                )
            else:
                # Calculate progress for update message
                completed_count = (
                    sum(
                        1
                        for t in todos
                        if isinstance(t, dict)
                        and t.get("status") == "completed"
                    )
                    if isinstance(todos, list)
                    else 0
                )
                yield streaming_service.format_terminal_info(
                    f"Progress: {completed_count}/{todo_count} tasks completed",
                    "success",
                )
    elif tool_name == "generate_podcast":
        # Stream podcast metadata and audio URL
        yield streaming_service.format_tool_output_available(
            tool_call_id,
            tool_output
            if isinstance(tool_output, dict)
            else {"result": tool_output},
        )
        # Send appropriate terminal message
        if isinstance(tool_output, dict) and "error" not in tool_output:
            yield streaming_service.format_terminal_info(
                f"Podcast generated successfully: {tool_output.get('title', 'Podcast')}",
                "success",
            )
        else:
            error_msg = (
                tool_output.get("error", "Unknown error")
                if isinstance(tool_output, dict)
                else "Unknown error"
            )
            yield streaming_service.format_terminal_info(
                f"Podcast generation failed: {error_msg}",
                "error",
            )
    elif tool_name == "link_preview":
        # Stream the full link preview result so frontend can render the MediaCard
        yield streaming_service.format_tool_output_available(
            tool_call_id,
            tool_output
            if isinstance(tool_output, dict)
            else {"result": tool_output},
        )
        # Send appropriate terminal message
        if isinstance(tool_output, dict) and "error" not in tool_output:
            title = tool_output.get("title", "Link")
            yield streaming_service.format_terminal_info(
                f"Link preview loaded: {title[:50]}{'...' if len(title) > 50 else ''}",
                "success",
            )
        else:
            error_msg = (
                tool_output.get("error", "Failed to fetch")
                if isinstance(tool_output, dict)
                else "Failed to fetch"
            )
            yield streaming_service.format_terminal_info(
                f"Link preview failed: {error_msg}",
                "error",
            )
    elif tool_name == "display_image":
        # Stream the full image result so frontend can render the Image component
        yield streaming_service.format_tool_output_available(
            tool_call_id,
            tool_output
            if isinstance(tool_output, dict)
            else {"result": tool_output},
        )
        # Send terminal message
        if isinstance(tool_output, dict):
            title = tool_output.get("title") or tool_output.get(
                "alt", "Image"
            )
            yield streaming_service.format_terminal_info(
                f"Image analyzed: {title[:40]}{'...' if len(title) > 40 else ''}",
                "success",
            )
    elif tool_name == "scrape_webpage":
        # Stream the scrape result so frontend can render the Article component
        # Note: We send metadata for display, but content goes to LLM for processing
        if isinstance(tool_output, dict):
            # Create a display-friendly output (without full content for the card)
            display_output = {
                k: v for k, v in tool_output.items() if k != "content"
            }
            # But keep a truncated content preview
            if "content" in tool_output:
                content = tool_output.get("content", "")
                display_output["content_preview"] = (
                    content[:500] + "..." if len(content) > 500 else content
                )
            yield streaming_service.format_tool_output_available(
                tool_call_id,
                display_output,
            )
        else:
            yield streaming_service.format_tool_output_available(
                tool_call_id,
                {"result": tool_output},
            )
        # Send terminal message
        if isinstance(tool_output, dict) and "error" not in tool_output:
            title = tool_output.get("title", "Webpage")
            word_count = tool_output.get("word_count", 0)
            yield streaming_service.format_terminal_info(
                f"Scraped: {title[:40]}{'...' if len(title) > 40 else ''} ({word_count:,} words)",
                "success",
            )
        else:
            error_msg = (
                tool_output.get("error", "Failed to scrape")
                if isinstance(tool_output, dict)
                else "Failed to scrape"
            )
            yield streaming_service.format_terminal_info(
                f"Scrape failed: {error_msg}",
                "error",
            )
    else:
        # Generic tool output
        yield streaming_service.format_tool_output_available(
            tool_call_id,
            tool_output
            if isinstance(tool_output, dict)
            else {"result": tool_output},
        )
