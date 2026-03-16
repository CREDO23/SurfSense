"""Firecrawl API fetcher (premium tier).

Extracted from webcrawler_connector.py _crawl_with_firecrawl().
"""

from firecrawl import AsyncFirecrawlApp

from .types import FetchResult, PageMetadata


async def fetch_with_firecrawl(
    url: str,
    api_key: str,
    formats: list[str] | None = None,
) -> FetchResult:
    """Fetch a URL using the Firecrawl API.

    Raises:
        ValueError: If the API key is missing or Firecrawl returns no result.
    """
    if not api_key:
        raise ValueError("Firecrawl API key not provided.")

    app = AsyncFirecrawlApp(api_key=api_key)
    if formats is None:
        formats = ["markdown"]

    scrape_result = await app.scrape(url, formats=formats)
    if not scrape_result:
        raise ValueError("Firecrawl returned no result")

    content = scrape_result.markdown or scrape_result.html or ""
    meta_obj = scrape_result.metadata
    meta = meta_obj.model_dump() if meta_obj else {}

    metadata = PageMetadata(
        source=url,
        title=meta.get("title", url),
        description=meta.get("description", ""),
        language=meta.get("language", ""),
    )

    extra = {k: v for k, v in meta.items() if k not in ("title", "description", "language")}

    return FetchResult(
        content=content,
        metadata=metadata,
        crawler_type="firecrawl",
        extra_metadata={**extra, "sourceURL": meta.get("source_url", url)},
    )
