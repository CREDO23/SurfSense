import { type ColumnDef } from "@tanstack/react-table";
import { motion, type Variants } from "motion/react";
import {
	Bug,
	Info,
	AlertTriangle,
	AlertCircle,
	Zap,
	Clock,
	CheckCircle2,
	X,
	Terminal,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MessageDetails } from "./MessageDetails";
import { LogRowActions } from "./LogRowActions";
import type { Log } from "@/contracts/types/log.types";
import { type LogLevel, type LogStatus } from "@/hooks/use-logs";

export const fadeInScale: Variants = {
	hidden: { opacity: 0, scale: 0.95 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: { type: "spring", stiffness: 300, damping: 30 },
	},
	exit: {
		opacity: 0,
		scale: 0.95,
		transition: { duration: 0.15 },
	},
};

export const logLevelConfig = {
	DEBUG: { icon: Bug, color: "text-muted-foreground", bgColor: "bg-muted/50" },
	INFO: { icon: Info, color: "text-blue-600", bgColor: "bg-blue-50" },
	WARNING: {
		icon: AlertTriangle,
		color: "text-yellow-600",
		bgColor: "bg-yellow-50",
	},
	ERROR: { icon: AlertCircle, color: "text-red-600", bgColor: "bg-red-50" },
	CRITICAL: { icon: Zap, color: "text-purple-600", bgColor: "bg-purple-50" },
};

export const logStatusConfig = {
	IN_PROGRESS: {
		icon: Clock,
		color: "text-blue-600",
		bgColor: "bg-blue-50",
		label: "In Progress",
	},
	SUCCESS: {
		icon: CheckCircle2,
		color: "text-green-600",
		bgColor: "bg-green-50",
		label: "Success",
	},
	FAILED: { icon: X, color: "text-red-600", bgColor: "bg-red-50", label: "Failed" },
};

export function createColumns(t: (key: string) => string): ColumnDef<Log>[] {
	return [
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Select all"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
				/>
			),
			enableHiding: false,
			size: 28,
		},
		{
			accessorKey: "level",
			header: t("level"),
			cell: ({ row }) => {
				const level = row.getValue("level") as LogLevel;
				const config = logLevelConfig[level] || logLevelConfig.INFO;
				const Icon = config.icon;

				return (
					<motion.div variants={fadeInScale} initial="hidden" animate="visible">
						<Badge
							variant="outline"
							className={`flex items-center gap-1.5 whitespace-nowrap border-transparent ${config.bgColor}`}
						>
							<Icon className={`h-3.5 w-3.5 ${config.color}`} />
							<span className={`text-xs font-medium ${config.color}`}>{level}</span>
						</Badge>
					</motion.div>
				);
			},
			size: 120,
		},
		{
			accessorKey: "status",
			header: t("status"),
			cell: ({ row }) => {
				const status = row.getValue("status") as LogStatus;
				const config = logStatusConfig[status] || logStatusConfig.IN_PROGRESS;
				const Icon = config.icon;

				return (
					<motion.div variants={fadeInScale} initial="hidden" animate="visible">
						<Badge
							variant="outline"
							className={`flex items-center gap-1.5 whitespace-nowrap border-transparent ${config.bgColor}`}
						>
							<Icon className={`h-3.5 w-3.5 ${config.color}`} />
							<span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
						</Badge>
					</motion.div>
				);
			},
			size: 120,
		},
		{
			accessorKey: "source",
			header: t("source"),
			cell: ({ row }) => {
				const source = row.getValue("source") as string | null;
				return (
					<motion.div
						variants={fadeInScale}
						initial="hidden"
						animate="visible"
						className="flex items-center gap-2"
					>
						<Terminal className="h-4 w-4 text-muted-foreground" />
						<span className="text-sm">{source || t("unknown")}</span>
					</motion.div>
				);
			},
			size: 150,
		},
		{
			accessorKey: "message",
			header: t("message"),
			cell: ({ row }) => {
				const message = row.getValue("message") as string;
				const taskName = row.original.task_name;
				const metadata = row.original.metadata;
				const createdAt = row.original.created_at;

				return (
					<motion.div variants={fadeInScale} initial="hidden" animate="visible">
						<MessageDetails
							message={message}
							taskName={taskName}
							metadata={metadata}
							createdAt={createdAt}
						/>
					</motion.div>
				);
			},
			size: 500,
		},
		{
			accessorKey: "created_at",
			header: t("created_at"),
			cell: ({ row }) => {
				const createdAt = row.getValue("created_at") as string;
				return (
					<motion.div
						variants={fadeInScale}
						initial="hidden"
						animate="visible"
						className="text-sm text-muted-foreground"
					>
						{new Date(createdAt).toLocaleString()}
					</motion.div>
				);
			},
			size: 180,
		},
		{
			id: "actions",
			header: t("actions"),
			cell: ({ row }) => {
				return (
					<motion.div variants={fadeInScale} initial="hidden" animate="visible">
						<LogRowActions row={row} t={t} />
					</motion.div>
				);
			},
			enableHiding: false,
			size: 50,
		},
	];
}
