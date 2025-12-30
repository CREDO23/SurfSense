"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
	Loader2,
	Link2,
	Copy,
	Check,
	Clock,
	Hash,
	Trash2,
	RefreshCw,
	Calendar as CalIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Invite } from "@/contracts/types/invites.types";

export function InvitesTab({
	invites,
	loading,
	onRevokeInvite,
	canRevoke,
}: {
	invites: Invite[];
	loading: boolean;
	onRevokeInvite: (inviteId: number) => Promise<boolean>;
	canRevoke: boolean;
}) {
	const [copiedId, setCopiedId] = useState<number | null>(null);

	const copyInviteLink = useCallback((invite: Invite) => {
		const link = `${window.location.origin}/invite/${invite.invite_code}`;
		navigator.clipboard.writeText(link);
		setCopiedId(invite.id);
		toast.success("Invite link copied to clipboard");
		setTimeout(() => setCopiedId(null), 2000);
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 text-primary animate-spin" />
			</div>
		);
	}

	if (invites.length === 0) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex flex-col items-center justify-center py-16 text-center"
			>
				<div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
					<LinkIcon className="h-8 w-8 text-muted-foreground" />
				</div>
				<h3 className="text-lg font-medium mb-1">No invite links</h3>
				<p className="text-muted-foreground max-w-sm">
					Create an invite link to allow others to join your search space with specific roles.
				</p>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			className="space-y-4"
		>
			{invites.map((invite, index) => {
				const isExpired = invite.expires_at && new Date(invite.expires_at) < new Date();
				const isMaxedOut = invite.max_uses && invite.uses_count >= invite.max_uses;
				const isInactive = !invite.is_active || isExpired || isMaxedOut;

				return (
					<motion.div
						key={invite.id}
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: index * 0.05 }}
					>
						<Card
							className={cn("relative overflow-hidden transition-all", isInactive && "opacity-60")}
						>
							<CardContent className="p-4">
								<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
									<div className="flex items-start md:items-center gap-4 flex-1 min-w-0">
										<div
											className={cn(
												"h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center shrink-0",
												invite.is_active && !isExpired && !isMaxedOut
													? "bg-emerald-500/20"
													: "bg-muted"
											)}
										>
											<Link2
												className={cn(
													"h-5 w-5 md:h-6 md:w-6",
													invite.is_active && !isExpired && !isMaxedOut
														? "text-emerald-600"
														: "text-muted-foreground"
												)}
											/>
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<p className="font-medium truncate">{invite.name || "Unnamed Invite"}</p>
												{isExpired && (
													<Badge variant="destructive" className="text-xs">
														Expired
													</Badge>
												)}
												{isMaxedOut && (
													<Badge variant="secondary" className="text-xs">
														Maxed
													</Badge>
												)}
												{!invite.is_active && !isExpired && !isMaxedOut && (
													<Badge variant="secondary" className="text-xs">
														Inactive
													</Badge>
												)}
											</div>
											<div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-1 text-sm text-muted-foreground">
												<span className="flex items-center gap-1">
													<Shield className="h-3 w-3" />
													{invite.role?.name || "Default role"}
												</span>
												<span className="flex items-center gap-1">
													<Hash className="h-3 w-3" />
													{invite.uses_count}
													{invite.max_uses ? ` / ${invite.max_uses} uses` : " uses"}
												</span>
												{invite.expires_at && (
													<span className="flex items-center gap-1">
														<Clock className="h-3 w-3" />
														{isExpired
															? "Expired"
															: `Exp: ${new Date(invite.expires_at).toLocaleDateString()}`}
													</span>
												)}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
										<Button
											variant="outline"
											size="sm"
											className="gap-2 flex-1 md:flex-none"
											onClick={() => copyInviteLink(invite)}
											disabled={Boolean(isInactive)}
										>
											{copiedId === invite.id ? (
												<>
													<Check className="h-4 w-4 text-emerald-500" />
													<span className="md:inline">Copied!</span>
												</>
											) : (
												<>
													<Copy className="h-4 w-4" />
													<span className="md:inline">Copy</span>
												</>
											)}
										</Button>
										{canRevoke && (
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>Revoke invite?</AlertDialogTitle>
														<AlertDialogDescription>
															This will permanently delete this invite link. Anyone with this link
															will no longer be able to join.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancel</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => onRevokeInvite(invite.id)}
															className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
														>
															Revoke
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				);
			})}
		</motion.div>
	);
}

// ============ Create Invite Dialog ============


