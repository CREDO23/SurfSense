"""Content extraction from raw HTML using trafilatura."""

from typing import Any

import trafilatura


def extract_content(raw_html: str) -> str | None:
    """Extract main article content from HTML as markdown, stripping boilerplate."""
    if not raw_html or not raw_html.strip():
        return None

    content = trafilatura.extract(
        raw_html,
        output_format="markdown",
        include_comments=False,
        include_tables=True,
        include_images=True,
        include_links=True,
    )

    if not content or not content.strip():
        return None

    return content


def extract_metadata(raw_html: str) -> dict[str, Any]:
    """Extract page metadata (title, description, author, date) from HTML."""
    meta = trafilatura.extract_metadata(raw_html)
    if not meta:
        return {}

    result: dict[str, Any] = {}
    if meta.title:
        result["title"] = meta.title
    if meta.description:
        result["description"] = meta.description
    if meta.author:
        result["author"] = meta.author
    if meta.date:
        result["date"] = meta.date
    return result
