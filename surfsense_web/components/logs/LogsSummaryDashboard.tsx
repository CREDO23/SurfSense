"use client";

import { motion, type Variants } from "motion/react";
import { Activity, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fadeInScale: Variants = {
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

interface LogsSummaryDashboardProps {
	summary: any;
	loading: boolean;
	error: string | null;
	onRefresh: () => void;
}

export function LogsSummaryDashboard({
	summary,
	loading,
	error,
	onRefresh,
}: LogsSummaryDashboardProps) {
	const t = useTranslations("logs");
	
	if (loading) {
		return (
			<motion.div
				className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
			>
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
						<CardHeader className="pb-2">
							<div className="h-4 bg-muted rounded animate-pulse" />
						</CardHeader>
						<CardContent>
							<div className="h-8 bg-muted rounded animate-pulse" />
						</CardContent>
					</Card>
				))}
			</motion.div>
		);
	}

	if (error || !summary) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center h-32">
					<div className="flex flex-col items-center gap-2">
						<AlertCircle className="h-8 w-8 text-destructive" />
						<p className="text-sm text-destructive">{t("failed_load_summary")}</p>
						<Button variant="outline" size="sm" onClick={onRefresh}>
							{t("retry")}
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<motion.div
			className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ staggerChildren: 0.1 }}
		>
			{/* Total Logs */}
			<motion.div variants={fadeInScale}>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">{t("total_logs")}</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{summary.total_logs}</div>
						<p className="text-xs text-muted-foreground">
							{t("last_hours", { hours: summary.time_window_hours })}
						</p>
					</CardContent>
				</Card>
			</motion.div>

			{/* Active Tasks */}
			<motion.div variants={fadeInScale}>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">{t("active_tasks")}</CardTitle>
						<Clock className="h-4 w-4 text-blue-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">
							{summary.active_tasks?.length || 0}
						</div>
						<p className="text-xs text-muted-foreground">{t("currently_running")}</p>
					</CardContent>
				</Card>
			</motion.div>

			{/* Success Rate */}
			<motion.div variants={fadeInScale}>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">{t("success_rate")}</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{summary.total_logs > 0
								? Math.round(((summary.by_status?.SUCCESS || 0) / summary.total_logs) * 100)
								: 0}
							%
						</div>
						<p className="text-xs text-muted-foreground">
							{summary.by_status?.SUCCESS || 0} {t("successful")}
						</p>
					</CardContent>
				</Card>
			</motion.div>

			{/* Recent Failures */}
			<motion.div variants={fadeInScale}>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">{t("recent_failures")}</CardTitle>
						<AlertCircle className="h-4 w-4 text-red-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{summary.recent_failures?.length || 0}
						</div>
						<p className="text-xs text-muted-foreground">{t("need_attention")}</p>
					</CardContent>
				</Card>
			</motion.div>
		</motion.div>
	);
}
