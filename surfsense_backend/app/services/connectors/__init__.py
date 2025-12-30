"""Modular connector services.

This package contains split connector services, each handling
a specific integration (GitHub, Notion, Slack, etc.).
"""

from .base import BaseConnectorService
from .factory import ConnectorFactory

__all__ = ["BaseConnectorService", "ConnectorFactory"]
