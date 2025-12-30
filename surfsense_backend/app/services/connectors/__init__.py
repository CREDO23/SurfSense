"""Modular connector services.

This package contains split connector services, each handling
a specific integration (GitHub, Notion, Slack, etc.).
"""

from app.services.connectors.base import BaseConnectorService
from app.services.connectors.factory import ConnectorFactory

__all__ = ["BaseConnectorService", "ConnectorFactory"]
