import { useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";
import { toast } from "sonner";
import { membersAtom, myAccessAtom } from "@/atoms/members/members-query.atoms";
import { permissionsAtom } from "@/atoms/permissions/permissions-query.atoms";
import {
	createMemberMutationAtom,
	updateMemberMutationAtom,
	deleteMemberMutationAtom,
} from "@/atoms/members/members-mutation.atoms";
import {
	createRoleMutationAtom,
	updateRoleMutationAtom,
	deleteRoleMutationAtom,
} from "@/atoms/roles/roles-mutation.atoms";
import {
	createInviteMutationAtom,
	deleteInviteMutationAtom,
} from "@/atoms/invites/invites-mutation.atoms";
import { useQuery } from "@tanstack/react-query";
import { cacheKeys } from "@/lib/query-client/cache-keys";
import { invitesApiService } from "@/lib/apis/invites-api.service";
import { rolesApiService } from "@/lib/apis/roles-api.service";
import type {
	Role,
	CreateInviteRequest,
	DeleteInviteRequest,
	UpdateRoleRequest,
	UpdateMemberRequest,
	DeleteRoleRequest,
	DeleteMemberRequest,
	CreateRoleRequest,
} from "@/contracts";

export function useTeamPage(searchSpaceId: number) {
	// Access and permissions
	const { data: access = null, isLoading: accessLoading } = useAtomValue(myAccessAtom);

	const hasPermission = useCallback(
		(permission: string) => {
			if (!access) return false;
			if (access.is_owner) return true;
			return access.permissions?.includes(permission) ?? false;
		},
		[access]
	);

	// Members
	const {
		data: members = [],
		isLoading: membersLoading,
		refetch: fetchMembers,
	} = useAtomValue(membersAtom);

	// Roles
	const {
		data: roles = [],
		isLoading: rolesLoading,
		refetch: fetchRoles,
	} = useQuery({
		queryKey: cacheKeys.roles.all(searchSpaceId.toString()),
		queryFn: () => rolesApiService.getRoles({ search_space_id: searchSpaceId }),
		enabled: !!searchSpaceId,
	});

	// Invites
	const {
		data: invites = [],
		isLoading: invitesLoading,
		refetch: fetchInvites,
	} = useQuery({
		queryKey: cacheKeys.invites.all(searchSpaceId.toString()),
		queryFn: () => invitesApiService.getInvites({ search_space_id: searchSpaceId }),
		staleTime: 5 * 60 * 1000,
	});

	// Permissions
	const { data: permissionsData } = useAtomValue(permissionsAtom);
	const permissions = permissionsData?.permissions || [];
	const groupedPermissions = useMemo(() => {
		const groups: Record<string, typeof permissions> = {};
		for (const perm of permissions) {
			if (!groups[perm.category]) {
				groups[perm.category] = [];
			}
			groups[perm.category].push(perm);
		}
		return groups;
	}, [permissions]);

	const canInvite = hasPermission("members:invite");

	// Mutations
	const { mutateAsync: createRole } = useAtomValue(createRoleMutationAtom);
	const { mutateAsync: updateRole } = useAtomValue(updateRoleMutationAtom);
	const { mutateAsync: deleteRole } = useAtomValue(deleteRoleMutationAtom);
	const { mutateAsync: updateMember } = useAtomValue(updateMemberMutationAtom);
	const { mutateAsync: deleteMember } = useAtomValue(deleteMemberMutationAtom);
	const { mutateAsync: createInvite } = useAtomValue(createInviteMutationAtom);
	const { mutateAsync: revokeInvite } = useAtomValue(deleteInviteMutationAtom);

	// Handlers
	const handleRevokeInvite = useCallback(
		async (inviteId: number): Promise<boolean> => {
			const request: DeleteInviteRequest = {
				search_space_id: searchSpaceId,
				invite_id: inviteId,
			};
			await revokeInvite(request);
			return true;
		},
		[revokeInvite, searchSpaceId]
	);

	const handleCreateInvite = useCallback(
		async (inviteData: CreateInviteRequest["data"]) => {
			const request: CreateInviteRequest = {
				search_space_id: searchSpaceId,
				data: inviteData,
			};
			return await createInvite(request);
		},
		[createInvite, searchSpaceId]
	);

	const handleUpdateRole = useCallback(
		async (roleId: number, data: { permissions?: string[] }): Promise<Role> => {
			const request: UpdateRoleRequest = {
				search_space_id: searchSpaceId,
				role_id: roleId,
				data,
			};
			return await updateRole(request);
		},
		[updateRole, searchSpaceId]
	);

	const handleDeleteRole = useCallback(
		async (roleId: number): Promise<boolean> => {
			const request: DeleteRoleRequest = {
				search_space_id: searchSpaceId,
				role_id: roleId,
			};
			await deleteRole(request);
			return true;
		},
		[deleteRole, searchSpaceId]
	);

	const handleCreateRole = useCallback(
		async (roleData: CreateRoleRequest["data"]): Promise<Role> => {
			const request: CreateRoleRequest = {
				search_space_id: searchSpaceId,
				data: roleData,
			};
			return await createRole(request);
		},
		[createRole, searchSpaceId]
	);

	const handleUpdateMember = useCallback(
		async (memberId: number, data: { role_id?: number }) => {
			const request: UpdateMemberRequest = {
				search_space_id: searchSpaceId,
				member_id: memberId,
				data,
			};
			return await updateMember(request);
		},
		[updateMember, searchSpaceId]
	);

	const handleRemoveMember = useCallback(
		async (memberId: number): Promise<boolean> => {
			const request: DeleteMemberRequest = {
				search_space_id: searchSpaceId,
				member_id: memberId,
			};
			await deleteMember(request);
			return true;
		},
		[deleteMember, searchSpaceId]
	);

	const handleRefresh = useCallback(async () => {
		await Promise.all([fetchMembers(), fetchRoles(), fetchInvites()]);
		toast.success("Team data refreshed");
	}, [fetchMembers, fetchRoles, fetchInvites]);

	return {
		accessLoading,
		hasPermission,
		canInvite,
		members,
		membersLoading,
		roles,
		rolesLoading,
		invites,
		invitesLoading,
		groupedPermissions,
		handleRevokeInvite,
		handleCreateInvite,
		handleUpdateRole,
		handleDeleteRole,
		handleCreateRole,
		handleUpdateMember,
		handleRemoveMember,
		handleRefresh,
	};
}
