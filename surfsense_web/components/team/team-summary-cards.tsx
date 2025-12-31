import { LinkIcon, Shield, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Role, Membership, Invite } from "@/contracts";

interface TeamSummaryCardsProps {
	members: Membership[];
	roles: Role[];
	invites: Invite[];
}

export function TeamSummaryCards({ members, roles, invites }: TeamSummaryCardsProps) {
	const summaryCards = [
		{
			icon: Users,
			label: "Total Members",
			value: members.length,
			description: `${members.filter((m) => m.role?.name === "Owner").length} ${members.filter((m) => m.role?.name === "Owner").length === 1 ? "Owner" : "Owners"}`,
			color: "text-blue-500",
			bg: "bg-blue-500/10",
		},
		{
			icon: Shield,
			label: "Active Roles",
			value: roles.filter((r) => !r.is_system_role).length,
			description: `${roles.filter((r) => r.is_system_role).length} System Roles`,
			color: "text-purple-500",
			bg: "bg-purple-500/10",
		},
		{
			icon: LinkIcon,
			label: "Active Invites",
			value: invites.filter((i) => !i.is_expired).length,
			description: `${invites.reduce((sum, i) => sum + (i.number_of_uses || 0), 0)} Total Uses`,
			color: "text-green-500",
			bg: "bg-green-500/10",
		},
	];

	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{summaryCards.map((card, index) => {
				const Icon = card.icon;
				return (
					<motion.div
						key={card.label}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
						className="rounded-lg border bg-card p-6"
					>
						<div className="flex items-start justify-between">
							<div className="space-y-2">
								<p className="text-sm font-medium text-muted-foreground">{card.label}</p>
								<p className="text-3xl font-bold">{card.value}</p>
								<p className="text-xs text-muted-foreground">{card.description}</p>
							</div>
							<div className={cn("rounded-full p-3", card.bg)}>
								<Icon className={cn("h-6 w-6", card.color)} />
							</div>
						</div>
					</motion.div>
				);
			})}
		</div>
	);
}
