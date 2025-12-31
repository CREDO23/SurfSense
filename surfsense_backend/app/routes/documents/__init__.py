"""
Document management routes module.

Combines all document sub-routers:
- create: Document creation endpoints (POST operations)
- query: Document retrieval and search (GET operations)
- modify: Document update and delete (PUT/DELETE operations)
"""

from fastapi import APIRouter

from . import create, modify, query

router = APIRouter()

# Include all sub-routers
router.include_router(create.router, tags=["documents-create"])
router.include_router(query.router, tags=["documents-query"])
router.include_router(modify.router, tags=["documents-modify"])

__all__ = ["router"]
