"""Member management endpoints for RBAC system."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models import (
    Permission,
    SearchSpaceMembership,
    User,
    get_async_session,
)
from app.schemas import MembershipRead, MembershipUpdate
from app.users import current_active_user
from app.utils.rbac import check_permission

logger = logging.getLogger(__name__)

router = APIRouter()
@router.get(
    "/searchspaces/{search_space_id}/members",
    response_model=list[MembershipRead],
)
async def list_members(
    search_space_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    List all members of a search space.
    Requires MEMBERS_VIEW permission.
    """
    try:
        await check_permission(
            session,
            user,
            search_space_id,
            Permission.MEMBERS_VIEW.value,
            "You don't have permission to view members",
        )

        result = await session.execute(
            select(SearchSpaceMembership)
            .options(selectinload(SearchSpaceMembership.role))
            .filter(SearchSpaceMembership.search_space_id == search_space_id)
        )
        memberships = result.scalars().all()

        # Fetch user emails for each membership
        response = []
        for membership in memberships:
            user_result = await session.execute(
                select(User).filter(User.id == membership.user_id)
            )
            member_user = user_result.scalars().first()

            membership_dict = {
                "id": membership.id,
                "user_id": membership.user_id,
                "search_space_id": membership.search_space_id,
                "role_id": membership.role_id,
                "is_owner": membership.is_owner,
                "joined_at": membership.joined_at,
                "created_at": membership.created_at,
                "role": membership.role,
                "user_email": member_user.email if member_user else None,
            }
            response.append(membership_dict)

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch members: {e!s}"
        ) from e


@router.put(
    "/searchspaces/{search_space_id}/members/{membership_id}",
    response_model=MembershipRead,
)
async def update_member_role(
    search_space_id: int,
    membership_id: int,
    membership_update: MembershipUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Update a member's role.
    Requires MEMBERS_MANAGE_ROLES permission.
    Cannot change owner's role.
    """
    try:
        await check_permission(
            session,
            user,
            search_space_id,
            Permission.MEMBERS_MANAGE_ROLES.value,
            "You don't have permission to manage member roles",
        )

        result = await session.execute(
            select(SearchSpaceMembership)
            .options(selectinload(SearchSpaceMembership.role))
            .filter(
                SearchSpaceMembership.id == membership_id,
                SearchSpaceMembership.search_space_id == search_space_id,
            )
        )
        db_membership = result.scalars().first()

        if not db_membership:
            raise HTTPException(status_code=404, detail="Membership not found")

        # Cannot change owner's role
        if db_membership.is_owner:
            raise HTTPException(
                status_code=400,
                detail="Cannot change the owner's role",
            )

        # Verify the new role exists in this search space
        if membership_update.role_id:
            role_result = await session.execute(
                select(SearchSpaceRole).filter(
                    SearchSpaceRole.id == membership_update.role_id,
                    SearchSpaceRole.search_space_id == search_space_id,
                )
            )
            if not role_result.scalars().first():
                raise HTTPException(
                    status_code=404,
                    detail="Role not found in this search space",
                )

        db_membership.role_id = membership_update.role_id
        await session.commit()
        await session.refresh(db_membership)

        # Fetch user email
        user_result = await session.execute(
            select(User).filter(User.id == db_membership.user_id)
        )
        member_user = user_result.scalars().first()

        return {
            "id": db_membership.id,
            "user_id": db_membership.user_id,
            "search_space_id": db_membership.search_space_id,
            "role_id": db_membership.role_id,
            "is_owner": db_membership.is_owner,
            "joined_at": db_membership.joined_at,
            "created_at": db_membership.created_at,
            "role": db_membership.role,
            "user_email": member_user.email if member_user else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Failed to update member role: {e!s}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to update member role: {e!s}"
        ) from e


@router.delete("/searchspaces/{search_space_id}/members/{membership_id}")
async def remove_member(
    search_space_id: int,
    membership_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Remove a member from a search space.
    Requires MEMBERS_REMOVE permission.
    Cannot remove the owner.
    """
    try:
        await check_permission(
            session,
            user,
            search_space_id,
            Permission.MEMBERS_REMOVE.value,
            "You don't have permission to remove members",
        )

        result = await session.execute(
            select(SearchSpaceMembership).filter(
                SearchSpaceMembership.id == membership_id,
                SearchSpaceMembership.search_space_id == search_space_id,
            )
        )
        db_membership = result.scalars().first()

        if not db_membership:
            raise HTTPException(status_code=404, detail="Membership not found")

        if db_membership.is_owner:
            raise HTTPException(
                status_code=400,
                detail="Cannot remove the owner from the search space",
            )

        await session.delete(db_membership)
        await session.commit()
        return {"message": "Member removed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Failed to remove member: {e!s}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to remove member: {e!s}"
        ) from e


@router.delete("/searchspaces/{search_space_id}/members/me")
async def leave_search_space(
    search_space_id: int,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    """
    Leave a search space (remove own membership).
    Owners cannot leave their search space.
    """
    try:
        result = await session.execute(
            select(SearchSpaceMembership).filter(
                SearchSpaceMembership.user_id == user.id,
                SearchSpaceMembership.search_space_id == search_space_id,
            )
        )
        db_membership = result.scalars().first()

        if not db_membership:
            raise HTTPException(
                status_code=404,
                detail="You are not a member of this search space",
            )

        if db_membership.is_owner:
            raise HTTPException(
                status_code=400,
                detail="Owners cannot leave their search space. Transfer ownership first or delete the search space.",
            )

        await session.delete(db_membership)
        await session.commit()
        return {"message": "Successfully left the search space"}

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Failed to leave search space: {e!s}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to leave search space: {e!s}"
        ) from e


# ============ Invite Endpoints ============


