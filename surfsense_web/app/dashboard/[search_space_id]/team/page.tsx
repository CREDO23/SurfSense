"use client";

import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import {
	ArrowLeft,
	Calendar,
	Check,
	Clock,
	Copy,
	Crown,
	Edit2,
	Hash,
	Link2,
	LinkIcon,
	Loader2,
	MoreHorizontal,
	Plus,
	RefreshCw,
	Search,
	Shield,
	ShieldCheck,
	Trash2,
	User,
	UserMinus,
	UserPlus,
	Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	createInviteMutationAtom,
	deleteInviteMutationAtom,
} from "@/atoms/invites/invites-mutation.atoms";
import {
	deleteMemberMutationAtom,
	updateMemberMutationAtom,
} from "@/atoms/members/members-mutation.atoms";
import { membersAtom, myAccessAtom } from "@/atoms/members/members-query.atoms";
import { permissionsAtom } from "@/atoms/permissions/permissions-query.atoms";
import {
	createRoleMutationAtom,
	deleteRoleMutationAtom,
	updateRoleMutationAtom,
} from "@/atoms/roles/roles-mutation.atoms";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type {
	CreateInviteRequest,
	DeleteInviteRequest,
	Invite,
} from "@/contracts/types/invites.types";
import type {
	DeleteMembershipRequest,
	Membership,
	UpdateMembershipRequest,
} from "@/contracts/types/members.types";
import type {
	CreateRoleRequest,
	DeleteRoleRequest,
	Role,
	UpdateRoleRequest,
} from "@/contracts/types/roles.types";
import { invitesApiService } from "@/lib/apis/invites-api.service";
import { rolesApiService } from "@/lib/apis/roles-api.service";
import { cacheKeys } from "@/lib/query-client/cache-keys";
import { cn } from "@/lib/utils";
import { MembersTab } from "@/components/team/MembersTab";
import { RolesTab } from "@/components/team/RolesTab";
import { InvitesTab } from "@/components/team/InvitesTab";
import { CreateInviteDialog } from "@/components/team/CreateInviteDialog";
import { CreateRoleDialog } from "@/components/team/CreateRoleDialog";

// Animation variants
const fadeInUp = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.1 },
	},
};

const cardVariants = {
	hidden: { opacity: 0, scale: 0.95 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: { type: "spring" as const, stiffness: 300, damping: 30 },
	},
};

export default function TeamManagementPage() {
	const router = useRouter();
	const params = useParams();
	const searchSpaceId = Number(params.search_space_id);
	const [activeTab, setActiveTab] = useState("members");

	const { data: access = null, isLoading: accessLoading } = useAtomValue(myAccessAtom);

	const hasPermission = useCallback(
		(permission: string) => {
			if (!access) return false;
			if (access.is_owner) return true;
			return access.permissions?.includes(permission) ?? false;
		},
		[access]
	);

	const {
		data: members = [],
		isLoading: membersLoading,
		refetch: fetchMembers,
	} = useAtomValue(membersAtom);

	const { mutateAsync: createRole } = useAtomValue(createRoleMutationAtom);
	const { mutateAsync: updateRole } = useAtomValue(updateRoleMutationAtom);
	const { mutateAsync: deleteRole } = useAtomValue(deleteRoleMutationAtom);
	const { mutateAsync: updateMember } = useAtomValue(updateMemberMutationAtom);

	const { mutateAsync: deleteMember } = useAtomValue(deleteMemberMutationAtom);
	const { mutateAsync: createInvite } = useAtomValue(createInviteMutationAtom);
	const { mutateAsync: revokeInvite } = useAtomValue(deleteInviteMutationAtom);

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
				data: data,
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
		async (membershipId: number, roleId: number | null): Promise<Membership> => {
			const request: UpdateMembershipRequest = {
				search_space_id: searchSpaceId,
				membership_id: membershipId,
				data: {
					role_id: roleId,
				},
			};
			return (await updateMember(request)) as Membership;
		},
		[updateMember, searchSpaceId]
	);

	const handleRemoveMember = useCallback(
		async (membershipId: number) => {
			const request: DeleteMembershipRequest = {
				search_space_id: searchSpaceId,
				membership_id: membershipId,
			};
			await deleteMember(request);

			return true;
		},
		[deleteMember, searchSpaceId]
	);
	const {
		data: roles = [],
		isLoading: rolesLoading,
		refetch: fetchRoles,
	} = useQuery({
		queryKey: cacheKeys.roles.all(searchSpaceId.toString()),
		queryFn: () => rolesApiService.getRoles({ search_space_id: searchSpaceId }),
		enabled: !!searchSpaceId,
	});
	const {
		data: invites = [],
		isLoading: invitesLoading,
		refetch: fetchInvites,
	} = useQuery({
		queryKey: cacheKeys.invites.all(searchSpaceId.toString()),
		queryFn: () => invitesApiService.getInvites({ search_space_id: searchSpaceId }),
		staleTime: 5 * 60 * 1000,
	});

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

	const handleRefresh = useCallback(async () => {
		await Promise.all([fetchMembers(), fetchRoles(), fetchInvites()]);
		toast.success("Team data refreshed");
	}, [fetchMembers, fetchRoles, fetchInvites]);

	if (accessLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="flex flex-col items-center gap-4"
				>
					<Loader2 className="h-10 w-10 text-primary animate-spin" />
					<p className="text-muted-foreground">Loading team data...</p>
				</motion.div>
			</div>
		);
	}

	return (
		<motion.div
			initial="hidden"
			animate="visible"
			variants={staggerContainer}
			className="min-h-screen bg-background"
		>
			<div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
				<motion.div variants={fadeInUp} className="space-y-8">
					{/* Header */}
					<div className="space-y-4">
						<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
							<div className="flex items-start space-x-3 md:items-center md:space-x-4">
								<button
									onClick={() => router.push(`/dashboard/${searchSpaceId}`)}
									className="flex items-center justify-center h-9 w-9 md:h-10 md:w-10 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors shrink-0"
									aria-label="Back to Dashboard"
									type="button"
								>
									<ArrowLeft className="h-4 w-4 md:h-5 md:w-5 text-primary" />
								</button>
								<div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10 shrink-0">
									<Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
								</div>
								<div className="space-y-1 min-w-0">
									<h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
										Team Management
									</h1>
									<p className="text-xs md:text-sm text-muted-foreground">
										Manage members, roles, and invite links for your search space
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button
									onClick={handleRefresh}
									variant="outline"
									size="sm"
									className="gap-2 w-full md:w-auto"
								>
									<RefreshCw className="h-4 w-4" />
									Refresh
								</Button>
							</div>
						</div>
					</div>

					{/* Summary Cards */}
					<motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<motion.div variants={cardVariants}>
							<Card className="relative overflow-hidden border-none bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent">
								<div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">Total Members</CardTitle>
									<Users className="h-5 w-5 text-blue-500" />
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
										{members.length}
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										{members.filter((m) => m.is_owner).length} owner
										{members.filter((m) => m.is_owner).length !== 1 ? "s" : ""}
									</p>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div variants={cardVariants}>
							<Card className="relative overflow-hidden border-none bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent">
								<div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">Active Roles</CardTitle>
									<Shield className="h-5 w-5 text-violet-500" />
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold text-violet-600 dark:text-violet-400">
										{roles.length}
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										{roles.filter((r) => r.is_system_role).length} system roles
									</p>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div variants={cardVariants}>
							<Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent">
								<div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">Active Invites</CardTitle>
									<Link2 className="h-5 w-5 text-emerald-500" />
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
										{invites.filter((i) => i.is_active).length}
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										{invites.reduce((acc, i) => acc + i.uses_count, 0)} total uses
									</p>
								</CardContent>
							</Card>
						</motion.div>
					</motion.div>

					{/* Tabs Content */}
					<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
						<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
							<div className="overflow-x-auto pb-1 md:pb-0">
								<TabsList className="bg-muted/50 p-1 w-full md:w-fit grid grid-cols-3 md:flex">
									<TabsTrigger
										value="members"
										className="gap-1.5 md:gap-2 data-[state=active]:bg-background whitespace-nowrap w-full text-xs md:text-sm flex-1"
									>
										<Users className="h-4 w-4 hidden md:block" />
										<span>Members</span>
										<Badge variant="secondary" className="ml-1 text-xs">
											{members.length}
										</Badge>
									</TabsTrigger>
									<TabsTrigger
										value="roles"
										className="gap-1.5 md:gap-2 data-[state=active]:bg-background whitespace-nowrap w-full text-xs md:text-sm flex-1"
									>
										<Shield className="h-4 w-4 hidden md:block" />
										<span>Roles</span>
										<Badge variant="secondary" className="ml-1 text-xs">
											{roles.length}
										</Badge>
									</TabsTrigger>
									<TabsTrigger
										value="invites"
										className="gap-1.5 md:gap-2 data-[state=active]:bg-background whitespace-nowrap w-full text-xs md:text-sm flex-1"
									>
										<LinkIcon className="h-4 w-4 hidden md:block" />
										<span>Invites</span>
										<Badge variant="secondary" className="ml-1 text-xs">
											{invites.filter((i) => i.is_active).length}
										</Badge>
									</TabsTrigger>
								</TabsList>
							</div>

							{activeTab === "invites" && canInvite && (
								<CreateInviteDialog
									roles={roles}
									onCreateInvite={handleCreateInvite}
									searchSpaceId={searchSpaceId}
									className="w-full md:w-auto"
								/>
							)}
							{activeTab === "roles" && hasPermission("roles:create") && (
								<CreateRoleDialog
									groupedPermissions={groupedPermissions}
									onCreateRole={handleCreateRole}
									className="w-full md:w-auto"
								/>
							)}
						</div>

						<TabsContent value="members" className="space-y-4">
							<MembersTab
								members={members}
								roles={roles}
								loading={membersLoading}
								onUpdateRole={handleUpdateMember}
								onRemoveMember={handleRemoveMember}
								canManageRoles={hasPermission("members:manage_roles")}
								canRemove={hasPermission("members:remove")}
							/>
						</TabsContent>

						<TabsContent value="roles" className="space-y-4">
							<RolesTab
								roles={roles}
								groupedPermissions={groupedPermissions}
								loading={rolesLoading}
								onUpdateRole={handleUpdateRole}
								onDeleteRole={handleDeleteRole}
								canUpdate={hasPermission("roles:update")}
								canDelete={hasPermission("roles:delete")}
							/>
						</TabsContent>

						<TabsContent value="invites" className="space-y-4">
							<InvitesTab
								invites={invites}
								loading={invitesLoading}
								onRevokeInvite={handleRevokeInvite}
								canRevoke={canInvite}
							/>
						</TabsContent>
					</Tabs>
				</motion.div>
			</div>
		</motion.div>
	);
}

// ============ Members Tab ============

