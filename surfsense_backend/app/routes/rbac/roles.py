"""Role management endpoints for RBAC system."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import (
    Permission,
    SearchSpaceRole,
    User,
    get_async_session,
)
from app.schemas import RoleCreate, RoleRead, RoleUpdate
from app.users import current_active_user
from app.utils.rbac import check_permission

logger = logging.getLogger(__name__)

router = APIRouter()
@router.post(
    "/searchspaces/{search_space_id}/roles",
    response_model=RoleRead,
)
async def create_role(
    search_space_id: int,
    role_data: RoleCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Create a new custom role in a search space.
    Requires ROLES_CREATE permission.
    """
    try:
        await check_permission(
            session,
            user,
            search_space_id,
            Permission.ROLES_CREATE.value,
            "You don't have permission to create roles",
        )

        # Check if role with same name already exists
        result = await session.execute(
            select(SearchSpaceRole).filter(
                SearchSpaceRole.search_space_id == search_space_id,
                SearchSpaceRole.name == role_data.name,
            )
        )
        if result.scalars().first():
            raise HTTPException(
                status_code=409,
                detail=f"A role with name '{role_data.name}' already exists in this search space",
            )

        # Validate permissions
        valid_permissions = {p.value for p in Permission}
        for perm in role_data.permissions:
            if perm not in valid_permissions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid permission: {perm}",
                )

        # If setting is_default to True, unset any existing default
        if role_data.is_default:
            await session.execute(
                select(SearchSpaceRole).filter(
                    SearchSpaceRole.search_space_id == search_space_id,
                    SearchSpaceRole.is_default == True,  # noqa: E712
                )
            )
            existing_defaults = await session.execute(
                select(SearchSpaceRole).filter(
                    SearchSpaceRole.search_space_id == search_space_id,
                    SearchSpaceRole.is_default == True,  # noqa: E712
                )
            )
            for existing in existing_defaults.scalars().all():
                existing.is_default = False

        db_role = SearchSpaceRole(
            **role_data.model_dump(),
            search_space_id=search_space_id,
            is_system_role=False,
        )
        session.add(db_role)
        await session.commit()
        await session.refresh(db_role)
        return db_role

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Failed to create role: {e!s}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to create role: {e!s}"
        ) from e


@router.get(
    "/searchspaces/{search_space_id}/roles",
    response_model=list[RoleRead],
)
async def list_roles(
    search_space_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    List all roles in a search space.
    Requires ROLES_READ permission.
    """
    try:
        await check_permission(
            session,
            user,
            search_space_id,
            Permission.ROLES_READ.value,
            "You don't have permission to view roles",
        )

        result = await session.execute(
            select(SearchSpaceRole).filter(
                SearchSpaceRole.search_space_id == search_space_id
            )
        )
        return result.scalars().all()

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch roles: {e!s}"
        ) from e


@router.get(
    "/searchspaces/{search_space_id}/roles/{role_id}",
    response_model=RoleRead,
)
async def get_role(
    search_space_id: int,
    role_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Get a specific role by ID.
    Requires ROLES_READ permission.
    """
    try:
        await check_permission(
            session,
            user,
            search_space_id,
            Permission.ROLES_READ.value,
            "You don't have permission to view roles",
        )

        result = await session.execute(
            select(SearchSpaceRole).filter(
                SearchSpaceRole.id == role_id,
                SearchSpaceRole.search_space_id == search_space_id,
            )
        )
        role = result.scalars().first()

        if not role:
            raise HTTPException(status_code=404, detail="Role not found")

        return role

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch role: {e!s}"
        ) from e


@router.put(
    "/searchspaces/{search_space_id}/roles/{role_id}",
    response_model=RoleRead,
)
async def update_role(
    search_space_id: int,
    role_id: int,
    role_update: RoleUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Update a role.
    Requires ROLES_UPDATE permission.
    System roles can only have their permissions updated, not name/description.
    """
    try:
        await check_permission(
            session,
            user,
            search_space_id,
            Permission.ROLES_UPDATE.value,
            "You don't have permission to update roles",
        )

        result = await session.execute(
            select(SearchSpaceRole).filter(
                SearchSpaceRole.id == role_id,
                SearchSpaceRole.search_space_id == search_space_id,
            )
        )
        db_role = result.scalars().first()

        if not db_role:
            raise HTTPException(status_code=404, detail="Role not found")

        update_data = role_update.model_dump(exclude_unset=True)

        # System roles have restrictions on what can be updated
        if db_role.is_system_role:
            # Can only update permissions for system roles
            restricted_fields = {"name", "description", "is_default"}
            if any(field in update_data for field in restricted_fields):
                raise HTTPException(
                    status_code=400,
                    detail="Cannot modify name, description, or default status of system roles",
                )

        # Check for name conflict if updating name
        if "name" in update_data and update_data["name"] != db_role.name:
            existing = await session.execute(
                select(SearchSpaceRole).filter(
                    SearchSpaceRole.search_space_id == search_space_id,
                    SearchSpaceRole.name == update_data["name"],
                )
            )
            if existing.scalars().first():
                raise HTTPException(
                    status_code=409,
                    detail=f"A role with name '{update_data['name']}' already exists",
                )

        # Validate permissions if provided
        if "permissions" in update_data:
            valid_permissions = {p.value for p in Permission}
            for perm in update_data["permissions"]:
                if perm not in valid_permissions:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid permission: {perm}",
                    )

        # Handle is_default change
        if update_data.get("is_default") and not db_role.is_default:
            # Unset existing default
            existing_defaults = await session.execute(
                select(SearchSpaceRole).filter(
                    SearchSpaceRole.search_space_id == search_space_id,
                    SearchSpaceRole.is_default == True,  # noqa: E712
                )
            )
            for existing in existing_defaults.scalars().all():
                existing.is_default = False

        for key, value in update_data.items():
            setattr(db_role, key, value)

        await session.commit()
        await session.refresh(db_role)
        return db_role

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Failed to update role: {e!s}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to update role: {e!s}"
        ) from e


@router.delete("/searchspaces/{search_space_id}/roles/{role_id}")
async def delete_role(
    search_space_id: int,
    role_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Delete a custom role.
    Requires ROLES_DELETE permission.
    System roles cannot be deleted.
    """
    try:
        await check_permission(
            session,
            user,
            search_space_id,
            Permission.ROLES_DELETE.value,
            "You don't have permission to delete roles",
        )

        result = await session.execute(
            select(SearchSpaceRole).filter(
                SearchSpaceRole.id == role_id,
                SearchSpaceRole.search_space_id == search_space_id,
            )
        )
        db_role = result.scalars().first()

        if not db_role:
            raise HTTPException(status_code=404, detail="Role not found")

        if db_role.is_system_role:
            raise HTTPException(
                status_code=400,
                detail="System roles cannot be deleted",
            )

        await session.delete(db_role)
        await session.commit()
        return {"message": "Role deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Failed to delete role: {e!s}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to delete role: {e!s}"
        ) from e


# ============ Membership Endpoints ============


