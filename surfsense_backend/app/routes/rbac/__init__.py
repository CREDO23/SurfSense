"""
RBAC (Role-Based Access Control) routes module.

Combines all RBAC sub-routers:
- permissions: List all available permissions
- roles: CRUD operations for roles
- members: CRUD operations for memberships
- invites: CRUD operations for invites
"""

from fastapi import APIRouter

from . import invites, members, permissions, roles

router = APIRouter()

# Include all sub-routers
router.include_router(permissions.router, tags=["permissions"])
router.include_router(roles.router, tags=["roles"])
router.include_router(members.router, tags=["members"])
router.include_router(invites.router, tags=["invites"])

__all__ = ["router"]
