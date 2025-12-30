from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class SearxngConnectorService(BaseConnectorService):
    """Service for searching SearXNG Search."""  

    CONNECTOR_ID = 23
    CONNECTOR_NAME = "SearXNG Search"
    CONNECTOR_TYPE = "SEARXNG_SEARCH"
    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
    ) -> tuple:
        """
        Search using a configured SearxNG instance and return both sources and documents.
        """
        searx_connector = await self.get_connector_by_type(
            SearchSourceConnectorType.SEARXNG_API, search_space_id
        )

        if not searx_connector:
            return {
                "id": 11,
                "name": "SearxNG Search",
                "type": "SEARXNG_API",
                "sources": [],
            }, []

        config = searx_connector.config or {}
        host = config.get("SEARXNG_HOST")

        if not host:
            print("SearxNG connector is missing SEARXNG_HOST configuration")
            return {
                "id": 11,
                "name": "SearxNG Search",
                "type": "SEARXNG_API",
                "sources": [],
            }, []

        api_key = config.get("SEARXNG_API_KEY")
        engines = config.get("SEARXNG_ENGINES")
        categories = config.get("SEARXNG_CATEGORIES")
        language = config.get("SEARXNG_LANGUAGE")
        safesearch = config.get("SEARXNG_SAFESEARCH")

        def _parse_bool(value: Any, default: bool = True) -> bool:
            if isinstance(value, bool):
                return value
            if isinstance(value, str):
                lowered = value.strip().lower()
                if lowered in {"true", "1", "yes", "on"}:
                    return True
                if lowered in {"false", "0", "no", "off"}:
                    return False
            return default

        verify_ssl = _parse_bool(config.get("SEARXNG_VERIFY_SSL", True))

        safesearch_value: int | None = None
        if isinstance(safesearch, str):
            safesearch_clean = safesearch.strip()
            if safesearch_clean.isdigit():
                safesearch_value = int(safesearch_clean)
        elif isinstance(safesearch, int | float):
            safesearch_value = int(safesearch)

        if safesearch_value is not None and not (0 <= safesearch_value <= 2):
            safesearch_value = None

        def _format_list(value: Any) -> str | None:
            if value is None:
                return None
            if isinstance(value, str):
                value = value.strip()
                return value or None
            if isinstance(value, list | tuple | set):
                cleaned = [str(item).strip() for item in value if str(item).strip()]
                return ",".join(cleaned) if cleaned else None
            return str(value)

        params: dict[str, Any] = {
            "q": user_query,
            "format": "json",
            "language": language or "",
            "limit": max(1, min(top_k, 50)),
        }

        engines_param = _format_list(engines)
        if engines_param:
            params["engines"] = engines_param

        categories_param = _format_list(categories)
        if categories_param:
            params["categories"] = categories_param

        if safesearch_value is not None:
            params["safesearch"] = safesearch_value

        if not params.get("language"):
            params.pop("language")

        headers = {"Accept": "application/json"}
        if api_key:
            headers["X-API-KEY"] = api_key

        searx_endpoint = urljoin(host if host.endswith("/") else f"{host}/", "search")

        try:
            async with httpx.AsyncClient(timeout=20.0, verify=verify_ssl) as client:
                response = await client.get(
                    searx_endpoint,
                    params=params,
                    headers=headers,
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            print(f"Error searching with SearxNG: {exc!s}")
            return {
                "id": 11,
                "name": "SearxNG Search",
                "type": "SEARXNG_API",
                "sources": [],
            }, []

        try:
            data = response.json()
        except ValueError:
            print("Failed to decode JSON response from SearxNG")
            return {
                "id": 11,
                "name": "SearxNG Search",
                "type": "SEARXNG_API",
                "sources": [],
            }, []

        searx_results = data.get("results", [])
        if not searx_results:
            return {
                "id": 11,
                "name": "SearxNG Search",
                "type": "SEARXNG_API",
                "sources": [],
            }, []

        sources_list: list[dict[str, Any]] = []
        documents: list[dict[str, Any]] = []

        async with self.counter_lock:
            for result in searx_results:
                description = result.get("content") or result.get("snippet") or ""
                if len(description) > 160:
                    description = f"{description}"

                source = {
                    "id": self.source_id_counter,
                    "title": result.get("title", "SearxNG Result"),
                    "description": description,
                    "url": result.get("url", ""),
                }
                sources_list.append(source)

                metadata = {
                    "url": result.get("url", ""),
                    "engines": result.get("engines", []),
                    "category": result.get("category"),
                    "source": "SEARXNG_API",
                }

                document = {
                    "chunk_id": self.source_id_counter,
                    "content": description or result.get("content", ""),
                    "score": result.get("score", 0.0),
                    "document": {
                        "id": self.source_id_counter,
                        "title": result.get("title", "SearxNG Result"),
                        "document_type": "SEARXNG_API",
                        "metadata": metadata,
                    },
                }
                documents.append(document)
                self.source_id_counter += 1

        result_object = {
            "id": 11,
            "name": "SearxNG Search",
            "type": "SEARXNG_API",
            "sources": sources_list,
        }

        return result_object, documents

