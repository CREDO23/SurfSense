"""Scrapling StealthyFetcher for anti-bot bypass (Cloudflare, JS-rendered SPAs)."""

import logging

from scrapling.fetchers import StealthyFetcher

from app.utils.proxy_config import get_playwright_proxy

from .content_extractor import extract_content, extract_metadata
from .types import FetchResult, PageMetadata

logger = logging.getLogger(__name__)


async def fetch_with_stealthy(url: str) -> FetchResult:
    """Fetch a URL using a stealth headless browser that bypasses anti-bot protections."""
    proxy = get_playwright_proxy()

    kwargs: dict = {
        "headless": True,
        "network_idle": True,
        "solve_cloudflare": True,
    }
    if proxy:
        kwargs["proxy"] = proxy

    page = await StealthyFetcher.async_fetch(url, **kwargs)
    raw_html = page.body.decode()

    if not raw_html or not raw_html.strip():
        raise ValueError(f"Stealthy fetcher returned empty content for {url}")

    content = extract_content(raw_html)
    traf_meta = extract_metadata(raw_html)

    metadata = PageMetadata(
        source=url,
        title=traf_meta.get("title", url),
        description=traf_meta.get("description", ""),
        author=traf_meta.get("author", ""),
        date=traf_meta.get("date", ""),
    )

    return FetchResult(
        content=content if content else raw_html,
        metadata=metadata,
        crawler_type="stealthy",
        raw_html=raw_html,
    )
