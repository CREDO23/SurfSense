"use client";

import { motion } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MembersTab } from "@/components/team/MembersTab";
import { RolesTab } from "@/components/team/RolesTab";
import { InvitesTab } from "@/components/team/InvitesTab";
import { CreateInviteDialog } from "@/components/team/CreateInviteDialog";
import { CreateRoleDialog } from "@/components/team/CreateRoleDialog";
import { TeamPageHeader } from "@/components/team/team-page-header";
import { TeamSummaryCards } from "@/components/team/team-summary-cards";
import { TeamLoadingState } from "@/components/team/team-loading-state";
import { useTeamPage } from "@/hooks/use-team-page";

export default function TeamManagementPage() {
	const router = useRouter();
	const params = useParams();
	const searchSpaceId = Number(params.search_space_id);
	const [activeTab, setActiveTab] = useState("members");

	const {
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
	} = useTeamPage(searchSpaceId);

	if (accessLoading) {
		return <TeamLoadingState />;
	}

	return (
		<div className="container mx-auto space-y-8 py-8">
			<TeamPageHeader
				searchSpaceId={searchSpaceId}
				onBack={() => router.push(`/dashboard/${searchSpaceId}`)}
				onRefresh={handleRefresh}
			/>

			<TeamSummaryCards members={members} roles={roles} invites={invites} />

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="members">Members</TabsTrigger>
					<TabsTrigger value="roles">Roles</TabsTrigger>
					<TabsTrigger value="invites">Invites</TabsTrigger>
				</TabsList>

				<TabsContent value="members" className="mt-6">
					<MembersTab
						members={members}
						roles={roles}
						isLoading={membersLoading || rolesLoading}
						onUpdateMember={handleUpdateMember}
						onRemoveMember={handleRemoveMember}
						hasPermission={hasPermission}
					/>
				</TabsContent>

				<TabsContent value="roles" className="mt-6">
					<RolesTab
						roles={roles}
						permissions={groupedPermissions}
						isLoading={rolesLoading}
						onUpdateRole={handleUpdateRole}
						onDeleteRole={handleDeleteRole}
						hasPermission={hasPermission}
					/>
					<CreateRoleDialog
						permissions={groupedPermissions}
						onCreateRole={handleCreateRole}
					/>
				</TabsContent>

				<TabsContent value="invites" className="mt-6">
					<InvitesTab
						invites={invites}
						roles={roles}
						isLoading={invitesLoading || rolesLoading}
						onRevokeInvite={handleRevokeInvite}
						hasPermission={hasPermission}
					/>
					<CreateInviteDialog
						roles={roles}
						onCreateInvite={handleCreateInvite}
						canInvite={canInvite}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
