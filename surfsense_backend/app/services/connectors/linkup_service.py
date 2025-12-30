from __future__ import annotations

from datetime import datetime
from typing import Any

from .base import BaseConnectorService


class LinkupConnectorService(BaseConnectorService):
    """Service for searching Linkup."""  

    CONNECTOR_ID = 16
    CONNECTOR_NAME = "Linkup"
    CONNECTOR_TYPE = "LINKUP_CONNECTOR"
    async def search(
        self,
        user_query: str,
        search_space_id: int,
        mode: str = "standard",
    ) -> tuple:
        """
        Search using Linkup API and return both the source information and documents

        Args:
            user_query: The user's query
            search_space_id: The search space ID
            mode: Search depth mode, can be "standard" or "deep"

        Returns:
            tuple: (sources_info, documents)
        """
        # Get Linkup connector configuration
        linkup_connector = await self.get_connector_by_type(
            SearchSourceConnectorType.LINKUP_API, search_space_id
        )

        if not linkup_connector:
            # Return empty results if no Linkup connector is configured
            return {
                "id": 10,
                "name": "Linkup Search",
                "type": "LINKUP_API",
                "sources": [],
            }, []

        # Initialize Linkup client with API key from connector config
        linkup_api_key = linkup_connector.config.get("LINKUP_API_KEY")
        linkup_client = LinkupClient(api_key=linkup_api_key)

        # Perform search with Linkup
        try:
            response = linkup_client.search(
                query=user_query,
                depth=mode,  # Use the provided mode ("standard" or "deep")
                output_type="searchResults",  # Default to search results
            )

            # Extract results from Linkup response - access as attribute instead of using .get()
            linkup_results = response.results if hasattr(response, "results") else []

            # Only proceed if we have results
            if not linkup_results:
                return {
                    "id": 10,
                    "name": "Linkup Search",
                    "type": "LINKUP_API",
                    "sources": [],
                }, []

            # Process each result and create sources directly without deduplication
            sources_list = []
            documents = []

            async with self.counter_lock:
                for _i, result in enumerate(linkup_results):
                    # Only process results that have content
                    if not hasattr(result, "content") or not result.content:
                        continue

                    # Create a source entry
                    source = {
                        "id": self.source_id_counter,
                        "title": (
                            result.name if hasattr(result, "name") else "Linkup Result"
                        ),
                        "description": (
                            result.content if hasattr(result, "content") else ""
                        ),
                        "url": result.url if hasattr(result, "url") else "",
                    }
                    sources_list.append(source)

                    # Create a document entry
                    document = {
                        "chunk_id": self.source_id_counter,
                        "content": result.content if hasattr(result, "content") else "",
                        "score": 1.0,  # Default score since not provided by Linkup
                        "document": {
                            "id": self.source_id_counter,
                            "title": (
                                result.name
                                if hasattr(result, "name")
                                else "Linkup Result"
                            ),
                            "document_type": "LINKUP_API",
                            "metadata": {
                                "url": result.url if hasattr(result, "url") else "",
                                "type": result.type if hasattr(result, "type") else "",
                                "source": "LINKUP_API",
                            },
                        },
                    }
                    documents.append(document)
                    self.source_id_counter += 1

            # Create result object
            result_object = {
                "id": 10,
                "name": "Linkup Search",
                "type": "LINKUP_API",
                "sources": sources_list,
            }

            return result_object, documents

        except Exception as e:
            # Log the error and return empty results
            print(f"Error searching with Linkup: {e!s}")
            return {
                "id": 10,
                "name": "Linkup Search",
                "type": "LINKUP_API",
                "sources": [],
            }, []

