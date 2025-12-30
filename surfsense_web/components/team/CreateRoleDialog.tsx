"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
	Loader2,
	Plus,
	Shield,
	ShieldCheck,
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
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { CreateRoleRequest, Role } from "@/contracts/types/roles.types";
import { cn } from "@/lib/utils";

export function CreateRoleDialog({
	groupedPermissions,
	onCreateRole,
	className,
}: {
	groupedPermissions: Record<string, { value: string; name: string; category: string }[]>;
	onCreateRole: (data: CreateRoleRequest["data"]) => Promise<Role>;
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	const [creating, setCreating] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
	const [isDefault, setIsDefault] = useState(false);

	const handleCreate = async () => {
		if (!name.trim()) {
			toast.error("Please enter a role name");
			return;
		}

		setCreating(true);
		try {
			await onCreateRole({
				name: name.trim(),
				description: description.trim() || null,
				permissions: selectedPermissions,
				is_default: isDefault,
			});
			setOpen(false);
			setName("");
			setDescription("");
			setSelectedPermissions([]);
			setIsDefault(false);
		} catch (error) {
			console.error("Failed to create role:", error);
		} finally {
			setCreating(false);
		}
	};

	const togglePermission = (perm: string) => {
		setSelectedPermissions((prev) =>
			prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
		);
	};

	const toggleCategory = (category: string) => {
		const categoryPerms = groupedPermissions[category]?.map((p) => p.value) || [];
		const allSelected = categoryPerms.every((p) => selectedPermissions.includes(p));

		if (allSelected) {
			setSelectedPermissions((prev) => prev.filter((p) => !categoryPerms.includes(p)));
		} else {
			setSelectedPermissions((prev) => [...new Set([...prev, ...categoryPerms])]);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className={cn("gap-2", className)}>
					<Plus className="h-4 w-4" />
					Create Role
				</Button>
			</DialogTrigger>
			<DialogContent className="w-[92vw] max-w-[92vw] sm:max-w-xl p-4 md:p-6">
				<DialogHeader>
					<DialogTitle>Create Custom Role</DialogTitle>
					<DialogDescription className="text-xs md:text-sm">
						Define a new role with specific permissions for this search space.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-3 py-2 md:py-4">
					<div className="flex flex-col md:grid md:grid-cols-2 gap-3 md:gap-4">
						<div className="space-y-2">
							<Label htmlFor="role-name">Role Name *</Label>
							<Input
								id="role-name"
								placeholder="e.g., Contributor"
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label className="flex items-center gap-2">
								<Checkbox checked={isDefault} onCheckedChange={(v) => setIsDefault(!!v)} />
								Set as default role
							</Label>
							<p className="text-xs text-muted-foreground">
								New invites without a role will use this
							</p>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="role-description">Description</Label>
						<Textarea
							id="role-description"
							placeholder="Describe what this role can do..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={2}
						/>
					</div>
					<div className="space-y-2">
						<Label>Permissions ({selectedPermissions.length} selected)</Label>
						<ScrollArea className="h-64 rounded-lg border p-4">
							<div className="space-y-4">
								{Object.entries(groupedPermissions).map(([category, perms]) => {
									const categorySelected = perms.filter((p) =>
										selectedPermissions.includes(p.value)
									).length;
									const allSelected = categorySelected === perms.length;

									return (
										<div key={category} className="space-y-2">
											<button
												type="button"
												className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded w-full text-left"
												onClick={() => toggleCategory(category)}
											>
												<Checkbox
													checked={allSelected}
													onCheckedChange={() => toggleCategory(category)}
												/>
												<span className="text-sm font-medium capitalize">
													{category} ({categorySelected}/{perms.length})
												</span>
											</button>
											<div className="grid grid-cols-2 gap-2 ml-6">
												{perms.map((perm) => (
													<button
														type="button"
														key={perm.value}
														className="flex items-center gap-2 cursor-pointer text-left"
														onClick={() => togglePermission(perm.value)}
													>
														<Checkbox
															checked={selectedPermissions.includes(perm.value)}
															onCheckedChange={() => togglePermission(perm.value)}
														/>
														<span className="text-xs">{perm.value.split(":")[1]}</span>
													</button>
												))}
											</div>
										</div>
									);
								})}
							</div>
						</ScrollArea>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button onClick={handleCreate} disabled={creating || !name.trim()}>
						{creating ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Creating...
							</>
						) : (
							"Create Role"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

