"""Orchestrator for webcrawling with tiered fallback chain."""

import logging

import validators

from .firecrawl_fetcher import fetch_with_firecrawl
from .scrapling_fetcher import fetch_with_scrapling
from .stealthy_fetcher import fetch_with_stealthy
from .types import FetchResult

logger = logging.getLogger(__name__)


class WebCrawlerClient:

    def __init__(self, firecrawl_api_key: str | None = None):
        self.firecrawl_api_key = firecrawl_api_key

    async def fetch_page(
        self, url: str, formats: list[str] | None = None
    ) -> tuple[FetchResult | None, str | None]:
        """Fetch a URL using a tiered fallback chain.

        Fallback order:
          1. Firecrawl (if API key configured)
          2. Scrapling HTTP (TLS fingerprint impersonation)
          3. Scrapling Stealthy (headless browser, anti-bot bypass)
        """
        try:
            if not validators.url(url):
                return None, f"Invalid URL: {url}"

            errors: list[str] = []

            if self.firecrawl_api_key:
                try:
                    logger.info(f"[webcrawler] Using Firecrawl for: {url}")
                    return await fetch_with_firecrawl(url, self.firecrawl_api_key, formats), None
                except Exception as exc:
                    errors.append(f"Firecrawl: {exc!s}")
                    logger.warning(f"[webcrawler] Firecrawl failed for {url}: {exc!s}")

            try:
                logger.info(f"[webcrawler] Using Scrapling HTTP for: {url}")
                result = await fetch_with_scrapling(url)
                if result:
                    return result, None
                errors.append("Scrapling HTTP: empty extraction")
            except Exception as exc:
                errors.append(f"Scrapling HTTP: {exc!s}")
                logger.warning(f"[webcrawler] Scrapling HTTP failed for {url}: {exc!s}")

            try:
                logger.info(f"[webcrawler] Using Stealthy browser for: {url}")
                return await fetch_with_stealthy(url), None
            except Exception as exc:
                errors.append(f"Stealthy: {exc!s}")
                logger.warning(f"[webcrawler] Stealthy failed for {url}: {exc!s}")

            return None, f"All crawl methods failed for {url}. {'; '.join(errors)}"

        except Exception as e:
            return None, f"Error crawling URL {url}: {e!s}"

    @staticmethod
    def format_to_structured_document(
        result: FetchResult, exclude_metadata: bool = False
    ) -> str:
        legacy = result.to_legacy_dict()
        metadata = legacy["metadata"]
        content = legacy["content"]

        document_parts = ["<DOCUMENT>"]

        if not exclude_metadata:
            document_parts.append("<METADATA>")
            for key, value in metadata.items():
                document_parts.append(f"{key.upper()}: {value}")
            document_parts.append("</METADATA>")

        document_parts.extend([
            "<CONTENT>",
            "FORMAT: markdown",
            "TEXT_START",
            content,
            "TEXT_END",
            "</CONTENT>",
            "</DOCUMENT>",
        ])

        return "\n".join(document_parts)
