"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
	Loader2,
	Shield,
	ShieldCheck,
	Edit2,
	Trash2,
	MoreHorizontal,
	Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Role } from "@/contracts/types/roles.types";

export function RolesTab({
	roles,
	groupedPermissions,
	loading,
	onUpdateRole,
	onDeleteRole,
	canUpdate,
	canDelete,
}: {
	roles: Role[];
	groupedPermissions: Record<string, { value: string; name: string; category: string }[]>;
	loading: boolean;
	onUpdateRole: (roleId: number, data: { permissions?: string[] }) => Promise<Role>;
	onDeleteRole: (roleId: number) => Promise<boolean>;
	canUpdate: boolean;
	canDelete: boolean;
}) {
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
			className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
		>
			{roles.map((role, index) => (
				<motion.div
					key={role.id}
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: index * 0.05 }}
				>
					<Card
						className={cn(
							"relative overflow-hidden transition-all hover:shadow-lg",
							role.is_system_role && "ring-1 ring-primary/20"
						)}
					>
						{role.is_system_role && (
							<div className="absolute top-0 right-0 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-bl-lg">
								System Role
							</div>
						)}
						<CardHeader>
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-3">
									<div
										className={cn(
											"h-10 w-10 rounded-lg flex items-center justify-center",
											role.name === "Owner" && "bg-amber-500/20",
											role.name === "Admin" && "bg-red-500/20",
											role.name === "Editor" && "bg-blue-500/20",
											role.name === "Viewer" && "bg-gray-500/20",
											!["Owner", "Admin", "Editor", "Viewer"].includes(role.name) && "bg-primary/20"
										)}
									>
										<ShieldCheck
											className={cn(
												"h-5 w-5",
												role.name === "Owner" && "text-amber-600",
												role.name === "Admin" && "text-red-600",
												role.name === "Editor" && "text-blue-600",
												role.name === "Viewer" && "text-gray-600",
												!["Owner", "Admin", "Editor", "Viewer"].includes(role.name) &&
													"text-primary"
											)}
										/>
									</div>
									<div>
										<CardTitle className="text-lg">{role.name}</CardTitle>
										{role.is_default && (
											<Badge variant="outline" className="text-xs mt-1">
												Default
											</Badge>
										)}
									</div>
								</div>
								{!role.is_system_role && (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon" className="h-8 w-8">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											{canUpdate && (
												<DropdownMenuItem
													onClick={() => {
														// TODO: Implement edit role dialog/modal
													}}
												>
													<Edit2 className="h-4 w-4 mr-2" />
													Edit Role
												</DropdownMenuItem>
											)}
											{canDelete && (
												<>
													<DropdownMenuSeparator />
													<AlertDialog>
														<AlertDialogTrigger asChild>
															<DropdownMenuItem
																className="text-destructive focus:text-destructive"
																onSelect={(e) => e.preventDefault()}
															>
																<Trash2 className="h-4 w-4 mr-2" />
																Delete Role
															</DropdownMenuItem>
														</AlertDialogTrigger>
														<AlertDialogContent>
															<AlertDialogHeader>
																<AlertDialogTitle>Delete role?</AlertDialogTitle>
																<AlertDialogDescription>
																	This will permanently delete the "{role.name}" role. Members with
																	this role will lose their permissions.
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>Cancel</AlertDialogCancel>
																<AlertDialogAction
																	onClick={() => onDeleteRole(role.id)}
																	className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
																>
																	Delete
																</AlertDialogAction>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog>
												</>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</div>
							{role.description && (
								<CardDescription className="mt-2">{role.description}</CardDescription>
							)}
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<Label className="text-xs text-muted-foreground uppercase tracking-wide">
									Permissions ({role.permissions.includes("*") ? "All" : role.permissions.length})
								</Label>
								<div className="flex flex-wrap gap-1">
									{role.permissions.includes("*") ? (
										<Badge
											variant="default"
											className="bg-gradient-to-r from-amber-500 to-orange-500"
										>
											Full Access
										</Badge>
									) : (
										role.permissions.slice(0, 5).map((perm) => (
											<Badge key={perm} variant="secondary" className="text-xs">
												{perm.replace(":", " ")}
											</Badge>
										))
									)}
									{!role.permissions.includes("*") && role.permissions.length > 5 && (
										<Badge variant="outline" className="text-xs">
											+{role.permissions.length - 5} more
										</Badge>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			))}
		</motion.div>
	);
}

// ============ Invites Tab ============


