"""Permissions endpoints for RBAC system."""

from fastapi import APIRouter, Depends

from app.models import Permission, User
from app.schemas import PermissionInfo, PermissionsListResponse
from app.users import current_active_user

router = APIRouter()


@router.get("/permissions", response_model=PermissionsListResponse)
async def list_all_permissions(
    user: User = Depends(current_active_user),
):
    """
    List all available permissions that can be assigned to roles.
    """
    permissions = []
    for perm in Permission:
        # Extract category from permission value (e.g., "documents:read" -> "documents")
        category = perm.value.split(":")[0] if ":" in perm.value else "general"

        permissions.append(
            PermissionInfo(
                value=perm.value,
                name=perm.name,
                category=category,
            )
        )

    return PermissionsListResponse(permissions=permissions)
