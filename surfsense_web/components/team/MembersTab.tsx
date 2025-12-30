"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
	Loader2,
	Search,
	Users,
	User,
	Crown,
	Calendar,
	UserMinus,
	Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Membership, Role } from "@/contracts/types/members.types";

interface MembersTabProps {
	members: Membership[];
	roles: Role[];
	loading: boolean;
	onUpdateRole: (membershipId: number, roleId: number | null) => Promise<Membership>;
	onRemoveMember: (membershipId: number) => Promise<boolean>;
	canManageRoles: boolean;
	canRemove: boolean;
}

export function MembersTab({
	members,
	roles,
	loading,
	onUpdateRole,
	onRemoveMember,
	canManageRoles,
	canRemove,
}: MembersTabProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredMembers = useMemo(() => {
		if (!searchQuery) return members;
		const query = searchQuery.toLowerCase();
		return members.filter(
			(m) =>
				m.user_email?.toLowerCase().includes(query) || m.role?.name.toLowerCase().includes(query)
		);
	}, [members, searchQuery]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 text-primary animate-spin" />
			</div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			className="space-y-4"
		>
			<div className="flex items-center gap-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search members..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
			</div>

			<div className="rounded-lg border bg-card overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/50">
							<TableHead className="w-auto md:w-[300px] px-2 md:px-4">Member</TableHead>
							<TableHead className="px-2 md:px-4">Role</TableHead>
							<TableHead className="hidden md:table-cell">Joined</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredMembers.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} className="text-center py-12">
									<div className="flex flex-col items-center gap-2">
										<Users className="h-8 w-8 text-muted-foreground/50" />
										<p className="text-muted-foreground">No members found</p>
									</div>
								</TableCell>
							</TableRow>
						) : (
							filteredMembers.map((member, index) => (
								<motion.tr
									key={member.id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05 }}
									className="group border-b transition-colors hover:bg-muted/50"
								>
									<TableCell className="py-2 px-2 md:py-4 md:px-4 align-middle">
										<div className="flex items-center gap-1.5 md:gap-3">
											<div className="relative">
												<div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-background">
													<User className="h-4 w-4 md:h-5 md:w-5 text-primary" />
												</div>
												{member.is_owner && (
													<div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center ring-2 ring-background">
														<Crown className="h-3 w-3 text-white" />
													</div>
												)}
											</div>
											<div className="min-w-0">
												<p className="font-medium text-xs md:text-sm truncate">
													{member.user_email || "Unknown"}
												</p>
												{member.is_owner && (
													<Badge
														variant="outline"
														className="text-[10px] md:text-xs mt-0.5 md:mt-1 bg-amber-500/10 text-amber-600 border-amber-500/20 hidden md:inline-flex"
													>
														Owner
													</Badge>
												)}
											</div>
										</div>
									</TableCell>
									<TableCell className="py-2 px-2 md:py-4 md:px-4 align-middle">
										{canManageRoles && !member.is_owner ? (
											<Select
												value={member.role_id?.toString() || "none"}
												onValueChange={(value) =>
													onUpdateRole(member.id, value === "none" ? null : Number(value))
												}
											>
												<SelectTrigger className="w-full md:w-[180px] h-8 md:h-10 text-xs md:text-sm">
													<SelectValue placeholder="Select role" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="none">No role</SelectItem>
													{roles.map((role) => (
														<SelectItem key={role.id} value={role.id.toString()}>
															<div className="flex items-center gap-2">
																<Shield className="h-3 w-3" />
																{role.name}
															</div>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										) : (
											<Badge
												variant="secondary"
												className="gap-1 text-[10px] md:text-xs py-0 md:py-0.5"
											>
												<Shield className="h-2.5 w-2.5 md:h-3 md:w-3" />
												{member.role?.name || "No role"}
											</Badge>
										)}
									</TableCell>
									<TableCell className="hidden md:table-cell">
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Calendar className="h-4 w-4" />
											{new Date(member.joined_at).toLocaleDateString()}
										</div>
									</TableCell>
									<TableCell className="text-right py-2 px-2 md:py-4 md:px-4 align-middle">
										{canRemove && !member.is_owner && (
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
														className="text-destructive hover:text-destructive hover:bg-destructive/10"
													>
														<UserMinus className="h-4 w-4" />
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>Remove member?</AlertDialogTitle>
														<AlertDialogDescription>
															This will remove{" "}
															<span className="font-medium">{member.user_email}</span> from this
															search space. They will lose access to all resources.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancel</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => onRemoveMember(member.id)}
															className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
														>
															Remove
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										)}
									</TableCell>
								</motion.tr>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</motion.div>
	);
}
