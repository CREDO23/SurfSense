"""Scrapling-based HTTP fetcher with TLS fingerprint impersonation."""

import logging

from scrapling.fetchers import AsyncFetcher

from app.utils.proxy_config import get_residential_proxy_url

from .content_extractor import extract_content, extract_metadata
from .types import FetchResult, PageMetadata

logger = logging.getLogger(__name__)


async def fetch_with_scrapling(url: str) -> FetchResult | None:
    """Fetch a URL using Scrapling's async HTTP client.

    Returns None when content extraction yields nothing (e.g. JS-rendered SPAs),
    signaling the caller to fall through to the stealthy fetcher.
    """
    proxy_url = get_residential_proxy_url()

    kwargs: dict = {
        "stealthy_headers": True,
        "follow_redirects": True,
        "timeout": 20,
    }
    if proxy_url:
        kwargs["proxy"] = proxy_url

    page = await AsyncFetcher.get(url, **kwargs)
    raw_html = page.body.decode()

    if not raw_html or not raw_html.strip():
        return None

    content = extract_content(raw_html)
    if not content or not content.strip():
        return None

    traf_meta = extract_metadata(raw_html)

    metadata = PageMetadata(
        source=url,
        title=traf_meta.get("title", url),
        description=traf_meta.get("description", ""),
        author=traf_meta.get("author", ""),
        date=traf_meta.get("date", ""),
    )

    return FetchResult(
        content=content,
        metadata=metadata,
        crawler_type="scrapling",
        raw_html=raw_html,
    )
