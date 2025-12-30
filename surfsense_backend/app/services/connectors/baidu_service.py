from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class BaiduConnectorService(BaseConnectorService):
    """Service for searching Baidu Search."""  

    CONNECTOR_ID = 24
    CONNECTOR_NAME = "Baidu Search"
    CONNECTOR_TYPE = "BAIDU_SEARCH"
    async def search(
        self,
        user_query: str,
        search_space_id: int,
        top_k: int = 20,
    ) -> tuple:
        """
        Search using Baidu AI Search API and return both sources and documents.

        Baidu AI Search provides intelligent search with automatic summarization.
        We extract the raw search results (references) from the API response.

        Args:
            user_query: User's search query
            search_space_id: Search space ID
            top_k: Maximum number of results to return

        Returns:
            tuple: (sources_info_dict, documents_list)
        """
        # Get Baidu connector configuration
        baidu_connector = await self.get_connector_by_type(
            SearchSourceConnectorType.BAIDU_SEARCH_API, search_space_id
        )

        if not baidu_connector:
            return {
                "id": 12,
                "name": self.CONNECTOR_NAME,
                "type": "BAIDU_SEARCH_API",
                "sources": [],
            }, []

        config = baidu_connector.config or {}
        api_key = config.get("BAIDU_API_KEY")

        if not api_key:
            print("ERROR: Baidu connector is missing BAIDU_API_KEY configuration")
            print(f"Connector config: {config}")
            return {
                "id": 12,
                "name": self.CONNECTOR_NAME,
                "type": "BAIDU_SEARCH_API",
                "sources": [],
            }, []

        # Optional configuration parameters
        model = config.get("BAIDU_MODEL", "ernie-3.5-8k")
        search_source = config.get("BAIDU_SEARCH_SOURCE", "baidu_search_v2")
        enable_deep_search = config.get("BAIDU_ENABLE_DEEP_SEARCH", False)

        # Baidu AI Search API endpoint
        baidu_endpoint = "https://qianfan.baidubce.com/v2/ai_search/chat/completions"

        # Prepare request headers
        # Note: Baidu uses X-Appbuilder-Authorization instead of standard Authorization header
        headers = {
            "X-Appbuilder-Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        # Prepare request payload
        # Calculate resource_type_filter top_k values
        # Baidu v2 supports max 20 per type
        max_per_type = min(top_k, 20)

        payload = {
            "messages": [{"role": "user", "content": user_query}],
            "model": model,
            "search_source": search_source,
            "resource_type_filter": [
                {"type": "web", "top_k": max_per_type},
                {"type": "video", "top_k": max(1, max_per_type // 4)},  # Fewer videos
            ],
            "stream": False,  # Non-streaming for simpler processing
            "enable_deep_search": enable_deep_search,
            "enable_corner_markers": True,  # Enable reference markers
        }

        try:
            # Baidu AI Search may take longer as it performs search + summarization
            # Increase timeout to 90 seconds
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(
                    baidu_endpoint,
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            print(f"ERROR: Baidu API request timeout after 90s: {exc!r}")
            print(f"Endpoint: {baidu_endpoint}")
            return {
                "id": 12,
                "name": self.CONNECTOR_NAME,
                "type": "BAIDU_SEARCH_API",
                "sources": [],
            }, []
        except httpx.HTTPStatusError as exc:
            print(f"ERROR: Baidu API HTTP Status Error: {exc.response.status_code}")
            print(f"Response text: {exc.response.text[:500]}")
            print(f"Request URL: {exc.request.url}")
            return {
                "id": 12,
                "name": self.CONNECTOR_NAME,
                "type": "BAIDU_SEARCH_API",
                "sources": [],
            }, []
        except httpx.RequestError as exc:
            print(f"ERROR: Baidu API Request Error: {type(exc).__name__}: {exc!r}")
            print(f"Endpoint: {baidu_endpoint}")
            return {
                "id": 12,
                "name": self.CONNECTOR_NAME,
                "type": "BAIDU_SEARCH_API",
                "sources": [],
            }, []
        except Exception as exc:
            print(
                f"ERROR: Unexpected error calling Baidu API: {type(exc).__name__}: {exc!r}"
            )
            print(f"Endpoint: {baidu_endpoint}")
            print(f"Payload: {payload}")
            return {
                "id": 12,
                "name": self.CONNECTOR_NAME,
                "type": "BAIDU_SEARCH_API",
                "sources": [],
            }, []

        try:
            data = response.json()
        except ValueError as e:
            print(f"ERROR: Failed to decode JSON response from Baidu AI Search: {e}")
            print(f"Response status: {response.status_code}")
            print(f"Response text: {response.text[:500]}")  # First 500 chars
            return {
                "id": 12,
                "name": self.CONNECTOR_NAME,
                "type": "BAIDU_SEARCH_API",
                "sources": [],
            }, []

        # Extract references (search results) from the response
        baidu_references = data.get("references", [])

        if "code" in data or "message" in data:
            print(
                f"WARNING: Baidu API returned error - Code: {data.get('code')}, Message: {data.get('message')}"
            )

        if not baidu_references:
            print("WARNING: No references found in Baidu API response")
            print(f"Response keys: {list(data.keys())}")
            return {
                "id": 12,
                "name": self.CONNECTOR_NAME,
                "type": "BAIDU_SEARCH_API",
                "sources": [],
            }, []

        sources_list: list[dict[str, Any]] = []
        documents: list[dict[str, Any]] = []

        async with self.counter_lock:
            for reference in baidu_references:
                # Extract basic fields
                title = reference.get("title", "Baidu Search Result")
                url = reference.get("url", "")
                content = reference.get("content", "")
                date = reference.get("date", "")
                ref_type = reference.get("type", "web")  # web, image, video

                # Create a source entry
                source = {
                    "id": self.source_id_counter,
                    "title": title,
                    "description": content[:300]
                    if content
                    else "",  # Limit description length
                    "url": url,
                }
                sources_list.append(source)

                # Prepare metadata
                metadata = {
                    "url": url,
                    "date": date,
                    "type": ref_type,
                    "source": "BAIDU_SEARCH_API",
                    "web_anchor": reference.get("web_anchor", ""),
                    "website": reference.get("website", ""),
                }

                # Add type-specific metadata
                if ref_type == "image" and reference.get("image"):
                    metadata["image"] = reference["image"]
                elif ref_type == "video" and reference.get("video"):
                    metadata["video"] = reference["video"]

                # Create a document entry
                document = {
                    "chunk_id": self.source_id_counter,
                    "content": content,
                    "score": 1.0,  # Baidu doesn't provide relevance scores
                    "document": {
                        "id": self.source_id_counter,
                        "title": title,
                        "document_type": "BAIDU_SEARCH_API",
                        "metadata": metadata,
                    },
                }
                documents.append(document)
                self.source_id_counter += 1

        result_object = {
            "id": 12,
            "name": self.CONNECTOR_NAME,
            "type": "BAIDU_SEARCH_API",
            "sources": sources_list,
        }

        return result_object, documents

