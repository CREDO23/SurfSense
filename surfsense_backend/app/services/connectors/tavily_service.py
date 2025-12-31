from __future__ import annotations

from datetime import datetime
import logging
from typing import Any

from .base import BaseConnectorService

logger = logging.getLogger(__name__)


class TavilyConnectorService(BaseConnectorService):
    """Service for searching Tavily Search."""  

    CONNECTOR_ID = 22
    CONNECTOR_NAME = "Tavily Search"
    CONNECTOR_TYPE = "TAVILY_SEARCH"
    async def search(
        self, user_query: str, search_space_id: int, top_k: int = 20
    ) -> tuple:
        """
        Search using Tavily API and return both the source information and documents

        Args:
            user_query: The user's query
            search_space_id: The search space ID
            top_k: Maximum number of results to return

        Returns:
            tuple: (sources_info, documents)
        """
        # Get Tavily connector configuration
        tavily_connector = await self.get_connector_by_type(
            SearchSourceConnectorType.TAVILY_API, search_space_id
        )

        if not tavily_connector:
            # Return empty results if no Tavily connector is configured
            return {
                "id": 3,
                "name": self.CONNECTOR_NAME,
                "type": "TAVILY_API",
                "sources": [],
            }, []

        # Initialize Tavily client with API key from connector config
        tavily_api_key = tavily_connector.config.get("TAVILY_API_KEY")
        tavily_client = TavilyClient(api_key=tavily_api_key)

        # Perform search with Tavily
        try:
            response = tavily_client.search(
                query=user_query,
                max_results=top_k,
                search_depth="advanced",  # Use advanced search for better results
            )

            # Extract results from Tavily response
            tavily_results = response.get("results", [])

            # Early return if no results
            if not tavily_results:
                return {
                    "id": 3,
                    "name": self.CONNECTOR_NAME,
                    "type": "TAVILY_API",
                    "sources": [],
                }, []

            # Process each result and create sources directly without deduplication
            sources_list = []
            documents = []

            async with self.counter_lock:
                for _i, result in enumerate(tavily_results):
                    # Create a source entry
                    source = {
                        "id": self.source_id_counter,
                        "title": result.get("title", "Tavily Result"),
                        "description": result.get("content", ""),
                        "url": result.get("url", ""),
                    }
                    sources_list.append(source)

                    # Create a document entry
                    document = {
                        "chunk_id": self.source_id_counter,
                        "content": result.get("content", ""),
                        "score": result.get("score", 0.0),
                        "document": {
                            "id": self.source_id_counter,
                            "title": result.get("title", "Tavily Result"),
                            "document_type": "TAVILY_API",
                            "metadata": {
                                "url": result.get("url", ""),
                                "published_date": result.get("published_date", ""),
                                "source": "TAVILY_API",
                            },
                        },
                    }
                    documents.append(document)
                    self.source_id_counter += 1

            # Create result object
            result_object = {
                "id": 3,
                "name": self.CONNECTOR_NAME,
                "type": "TAVILY_API",
                "sources": sources_list,
            }

            return result_object, documents

        except Exception as e:
            # Log the error and return empty results
            logger.error(f"Error searching with Tavily: {e!s}")
            return {
                "id": 3,
                "name": self.CONNECTOR_NAME,
                "type": "TAVILY_API",
                "sources": [],
            }, []
