"""Pytest configuration and shared fixtures."""
import pytest
from fastapi.testclient import TestClient

from app.app import app


@pytest.fixture(scope="function")
def client():
    """Provide a FastAPI test client."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth_headers() -> dict:
    """Provide authentication headers."""
    return {
        "Authorization": "Bearer test-token",
        "Content-Type": "application/json",
    }
