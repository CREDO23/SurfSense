"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
	Loader2,
	UserPlus,
	Link2,
	Calendar as CalIcon,
	Hash,
	Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CreateInviteRequest, Invite } from "@/contracts/types/invites.types";
import type { Role } from "@/contracts/types/roles.types";
import { cn } from "@/lib/utils";

export function CreateInviteDialog({
	roles,
	onCreateInvite,
	className,
}: {
	roles: Role[];
	onCreateInvite: (data: CreateInviteRequest["data"]) => Promise<Invite>;
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	const [creating, setCreating] = useState(false);
	const [name, setName] = useState("");
	const [roleId, setRoleId] = useState<string>("");
	const [maxUses, setMaxUses] = useState<string>("");
	const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
	const [createdInvite, setCreatedInvite] = useState<Invite | null>(null);
	const [copiedLink, setCopiedLink] = useState(false);

	const handleCreate = async () => {
		setCreating(true);
		try {
			const data: CreateInviteRequest["data"] = {};
			if (name) data.name = name;
			if (roleId && roleId !== "default") data.role_id = Number(roleId);
			if (maxUses) data.max_uses = Number(maxUses);
			if (expiresAt) data.expires_at = expiresAt.toISOString();

			const invite = await onCreateInvite(data);
			setCreatedInvite(invite);
		} catch (error) {
			console.error("Failed to create invite:", error);
		} finally {
			setCreating(false);
		}
	};

	const handleClose = () => {
		setOpen(false);
		setName("");
		setRoleId("");
		setMaxUses("");
		setExpiresAt(undefined);
		setCreatedInvite(null);
		setCopiedLink(false);
	};

	const copyLink = () => {
		if (!createdInvite) return;
		const link = `${window.location.origin}/invite/${createdInvite.invite_code}`;
		navigator.clipboard.writeText(link);
		setCopiedLink(true);
		toast.success("Invite link copied to clipboard");
	};

	return (
		<Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
			<DialogTrigger asChild>
				<Button className={cn("gap-2", className)}>
					<UserPlus className="h-4 w-4" />
					Create Invite
				</Button>
			</DialogTrigger>
			<DialogContent className="w-[92vw] max-w-[92vw] sm:max-w-md p-4 md:p-6">
				{createdInvite ? (
					<>
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<Check className="h-5 w-5 text-emerald-500" />
								Invite Created!
							</DialogTitle>
							<DialogDescription>
								Share this link to invite people to your search space.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-3 py-2 md:py-4">
							<div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
								<code className="flex-1 min-w-0 text-sm break-all">
									{window.location.origin}/invite/{createdInvite.invite_code}
								</code>
								<Button variant="outline" size="sm" onClick={copyLink} className="shrink-0">
									{copiedLink ? (
										<Check className="h-4 w-4 text-emerald-500" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</Button>
							</div>
							<div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
								<span className="flex items-center gap-1">
									<Shield className="h-3 w-3" />
									{createdInvite.role?.name || "Default role"}
								</span>
								{createdInvite.max_uses && (
									<span className="flex items-center gap-1">
										<Hash className="h-3 w-3" />
										Max {createdInvite.max_uses} uses
									</span>
								)}
								{createdInvite.expires_at && (
									<span className="flex items-center gap-1">
										<Clock className="h-3 w-3" />
										Expires {new Date(createdInvite.expires_at).toLocaleDateString()}
									</span>
								)}
							</div>
						</div>
						<DialogFooter>
							<Button onClick={handleClose}>Done</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>Create Invite Link</DialogTitle>
							<DialogDescription>
								Create a link to invite people to this search space.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-3 py-2 md:py-4">
							<div className="space-y-2">
								<Label htmlFor="invite-name">Name (optional)</Label>
								<Input
									id="invite-name"
									placeholder="e.g., Marketing team invite"
									value={name}
									onChange={(e) => setName(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="invite-role">Role</Label>
								<Select value={roleId} onValueChange={setRoleId}>
									<SelectTrigger>
										<SelectValue placeholder="Select a role (default: Viewer)" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="default">Default role (Viewer)</SelectItem>
										{roles
											.filter((r) => r.name !== "Owner")
											.map((role) => (
												<SelectItem key={role.id} value={role.id.toString()}>
													<div className="flex items-center gap-2">
														<Shield className="h-3 w-3" />
														{role.name}
													</div>
												</SelectItem>
											))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col md:grid md:grid-cols-2 gap-3 md:gap-4">
								<div className="space-y-2">
									<Label htmlFor="max-uses">Max uses (optional)</Label>
									<Input
										id="max-uses"
										type="number"
										min="1"
										placeholder="Unlimited"
										value={maxUses}
										onChange={(e) => setMaxUses(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label>Expires on (optional)</Label>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												className={cn(
													"w-full justify-start text-left font-normal",
													!expiresAt && "text-muted-foreground"
												)}
											>
												<Calendar className="mr-2 h-4 w-4" />
												{expiresAt ? expiresAt.toLocaleDateString() : "Never"}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="start">
											<CalendarComponent
												mode="single"
												selected={expiresAt}
												onSelect={setExpiresAt}
												disabled={(date) => date < new Date()}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
								</div>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={handleClose}>
								Cancel
							</Button>
							<Button onClick={handleCreate} disabled={creating}>
								{creating ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Creating...
									</>
								) : (
									"Create Invite"
								)}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}

// ============ Create Role Dialog ============


