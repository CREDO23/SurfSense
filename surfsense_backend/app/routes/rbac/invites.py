"""Invite management endpoints for RBAC system."""

import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models import (
    Permission,
    SearchSpace,
    SearchSpaceInvite,
    SearchSpaceMembership,
    User,
    get_async_session,
)
from app.schemas import (
    InviteAcceptRequest,
    InviteAcceptResponse,
    InviteCreate,
    InviteInfoResponse,
    InviteRead,
    InviteUpdate,
    UserSearchSpaceAccess,
)
from app.users import current_active_user
from app.utils.rbac import (
    check_permission,
    check_search_space_access,
    generate_invite_code,
    get_default_role,
    get_user_permissions,
)

logger = logging.getLogger(__name__)

router = APIRouter()
@router.post(
    "/searchspaces/{search_space_id}/invites",
    response_model=InviteRead,
)
async def create_invite(
    search_space_id: int,
    invite_data: InviteCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Create a new invite link for a search space.
    Requires MEMBERS_INVITE permission.
    """
    try:
        await check_permission(
            session,
            user,
            search_space_id,
            Permission.MEMBERS_INVITE.value,
            "You don't have permission to create invites",
        )

        # Verify role exists if specified
        if invite_data.role_id:
            role_result = await session.execute(
                select(SearchSpaceRole).filter(
                    SearchSpaceRole.id == invite_data.role_id,
                    SearchSpaceRole.search_space_id == search_space_id,
                )
            )
            if not role_result.scalars().first():
                raise HTTPException(
                    status_code=404,
                    detail="Role not found in this search space",
                )

        db_invite = SearchSpaceInvite(
            **invite_data.model_dump(),
            invite_code=generate_invite_code(),
            search_space_id=search_space_id,
            created_by_id=user.id,
        )
        session.add(db_invite)
        await session.commit()

        # Reload with role
        result = await session.execute(
            select(SearchSpaceInvite)
            .options(selectinload(SearchSpaceInvite.role))
            .filter(SearchSpaceInvite.id == db_invite.id)
        )
        db_invite = result.scalars().first()

        return db_invite

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Failed to create invite: {e!s}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to create invite: {e!s}"
        ) from e


@router.get(
    "/searchspaces/{search_space_id}/invites",
    response_model=list[InviteRead],
)
async def list_invites(
    search_space_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    List all invites for a search space.
    Requires MEMBERS_INVITE permission.
    """
    try:
        await check_permission(
            session,
            user,
            search_space_id,
            Permission.MEMBERS_INVITE.value,
            "You don't have permission to view invites",
        )

        result = await session.execute(
            select(SearchSpaceInvite)
            .options(selectinload(SearchSpaceInvite.role))
            .filter(SearchSpaceInvite.search_space_id == search_space_id)
        )
        return result.scalars().all()

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch invites: {e!s}"
        ) from e


@router.put(
    "/searchspaces/{search_space_id}/invites/{invite_id}",
    response_model=InviteRead,
)
async def update_invite(
    search_space_id: int,
    invite_id: int,
    invite_update: InviteUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Update an invite.
    Requires MEMBERS_INVITE permission.
    """
    try:
        await check_permission(
            session,
            user,
            search_space_id,
            Permission.MEMBERS_INVITE.value,
            "You don't have permission to update invites",
        )

        result = await session.execute(
            select(SearchSpaceInvite)
            .options(selectinload(SearchSpaceInvite.role))
            .filter(
                SearchSpaceInvite.id == invite_id,
                SearchSpaceInvite.search_space_id == search_space_id,
            )
        )
        db_invite = result.scalars().first()

        if not db_invite:
            raise HTTPException(status_code=404, detail="Invite not found")

        update_data = invite_update.model_dump(exclude_unset=True)

        # Verify role exists if updating role_id
        if update_data.get("role_id"):
            role_result = await session.execute(
                select(SearchSpaceRole).filter(
                    SearchSpaceRole.id == update_data["role_id"],
                    SearchSpaceRole.search_space_id == search_space_id,
                )
            )
            if not role_result.scalars().first():
                raise HTTPException(
                    status_code=404,
                    detail="Role not found in this search space",
                )

        for key, value in update_data.items():
            setattr(db_invite, key, value)

        await session.commit()
        await session.refresh(db_invite)
        return db_invite

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Failed to update invite: {e!s}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to update invite: {e!s}"
        ) from e


@router.delete("/searchspaces/{search_space_id}/invites/{invite_id}")
async def revoke_invite(
    search_space_id: int,
    invite_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Revoke (delete) an invite.
    Requires MEMBERS_INVITE permission.
    """
    try:
        await check_permission(
            session,
            user,
            search_space_id,
            Permission.MEMBERS_INVITE.value,
            "You don't have permission to revoke invites",
        )

        result = await session.execute(
            select(SearchSpaceInvite).filter(
                SearchSpaceInvite.id == invite_id,
                SearchSpaceInvite.search_space_id == search_space_id,
            )
        )
        db_invite = result.scalars().first()

        if not db_invite:
            raise HTTPException(status_code=404, detail="Invite not found")

        await session.delete(db_invite)
        await session.commit()
        return {"message": "Invite revoked successfully"}

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Failed to revoke invite: {e!s}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to revoke invite: {e!s}"
        ) from e


# ============ Public Invite Endpoints ============


@router.get("/invites/{invite_code}/info", response_model=InviteInfoResponse)
async def get_invite_info(
    invite_code: str,
    session: AsyncSession = Depends(get_async_session),
):
    """
    Get information about an invite (public endpoint, no auth required).
    Returns minimal info for displaying on invite acceptance page.
    """
    try:
        result = await session.execute(
            select(SearchSpaceInvite)
            .options(
                selectinload(SearchSpaceInvite.role),
                selectinload(SearchSpaceInvite.search_space),
            )
            .filter(SearchSpaceInvite.invite_code == invite_code)
        )
        invite = result.scalars().first()

        if not invite:
            return InviteInfoResponse(
                search_space_name="",
                role_name=None,
                is_valid=False,
                message="Invite not found",
            )

        # Check if invite is still valid
        if not invite.is_active:
            return InviteInfoResponse(
                search_space_name=invite.search_space.name
                if invite.search_space
                else "",
                role_name=invite.role.name if invite.role else None,
                is_valid=False,
                message="This invite is no longer active",
            )

        if invite.expires_at and invite.expires_at < datetime.now(UTC):
            return InviteInfoResponse(
                search_space_name=invite.search_space.name
                if invite.search_space
                else "",
                role_name=invite.role.name if invite.role else None,
                is_valid=False,
                message="This invite has expired",
            )

        if invite.max_uses and invite.uses_count >= invite.max_uses:
            return InviteInfoResponse(
                search_space_name=invite.search_space.name
                if invite.search_space
                else "",
                role_name=invite.role.name if invite.role else None,
                is_valid=False,
                message="This invite has reached its maximum uses",
            )

        return InviteInfoResponse(
            search_space_name=invite.search_space.name if invite.search_space else "",
            role_name=invite.role.name if invite.role else "Default",
            is_valid=True,
        )

    except Exception as e:
        logger.error(f"Failed to get invite info: {e!s}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to get invite info: {e!s}"
        ) from e


@router.post("/invites/accept", response_model=InviteAcceptResponse)
async def accept_invite(
    request: InviteAcceptRequest,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Accept an invite and join a search space.
    """
    try:
        result = await session.execute(
            select(SearchSpaceInvite)
            .options(
                selectinload(SearchSpaceInvite.role),
                selectinload(SearchSpaceInvite.search_space),
            )
            .filter(SearchSpaceInvite.invite_code == request.invite_code)
        )
        invite = result.scalars().first()

        if not invite:
            raise HTTPException(status_code=404, detail="Invite not found")

        # Validate invite
        if not invite.is_active:
            raise HTTPException(
                status_code=400, detail="This invite is no longer active"
            )

        if invite.expires_at and invite.expires_at < datetime.now(UTC):
            raise HTTPException(status_code=400, detail="This invite has expired")

        if invite.max_uses and invite.uses_count >= invite.max_uses:
            raise HTTPException(
                status_code=400, detail="This invite has reached its maximum uses"
            )

        # Check if user is already a member
        existing_membership = await session.execute(
            select(SearchSpaceMembership).filter(
                SearchSpaceMembership.user_id == user.id,
                SearchSpaceMembership.search_space_id == invite.search_space_id,
            )
        )
        if existing_membership.scalars().first():
            raise HTTPException(
                status_code=400,
                detail="You are already a member of this search space",
            )

        # Determine role to assign
        role_id = invite.role_id
        if not role_id:
            # Use default role
            default_role = await get_default_role(session, invite.search_space_id)
            role_id = default_role.id if default_role else None

        # Create membership
        membership = SearchSpaceMembership(
            user_id=user.id,
            search_space_id=invite.search_space_id,
            role_id=role_id,
            is_owner=False,
            invited_by_invite_id=invite.id,
        )
        session.add(membership)

        # Increment invite usage
        invite.uses_count += 1

        await session.commit()

        role_name = invite.role.name if invite.role else "Default"
        search_space_name = invite.search_space.name if invite.search_space else ""

        return InviteAcceptResponse(
            message="Successfully joined the search space",
            search_space_id=invite.search_space_id,
            search_space_name=search_space_name,
            role_name=role_name,
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Failed to accept invite: {e!s}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to accept invite: {e!s}"
        ) from e


# ============ User Access Info ============


@router.get(
    "/searchspaces/{search_space_id}/my-access",
    response_model=UserSearchSpaceAccess,
)
async def get_my_access(
    search_space_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Get the current user's access info for a search space.
    """
    try:
        membership = await check_search_space_access(session, user, search_space_id)

        # Get search space name
        result = await session.execute(
            select(SearchSpace).filter(SearchSpace.id == search_space_id)
        )
        search_space = result.scalars().first()

        # Get permissions
        permissions = await get_user_permissions(session, user.id, search_space_id)

        return UserSearchSpaceAccess(
            search_space_id=search_space_id,
            search_space_name=search_space.name if search_space else "",
            is_owner=membership.is_owner,
            role_name=membership.role.name if membership.role else None,
            permissions=permissions,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get access info: {e!s}"
        ) from e
