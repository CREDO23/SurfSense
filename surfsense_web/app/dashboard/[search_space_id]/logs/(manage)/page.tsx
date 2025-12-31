"use client";

import {
	type ColumnFiltersState,
	getCoreRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import { useAtomValue } from "jotai";
import { RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useCallback, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
	createLogMutationAtom,
	deleteLogMutationAtom,
	updateLogMutationAtom,
} from "@/atoms/logs/log-mutation.atoms";
import { Button } from "@/components/ui/button";
import type { CreateLogRequest, UpdateLogRequest } from "@/contracts/types/log.types";
import { useLogs, useLogsSummary } from "@/hooks/use-logs";
import { LogsFilters } from "@/components/logs/LogsFilters";
import { LogsSummaryDashboard } from "@/components/logs/LogsSummaryDashboard";
import { LogsTable } from "@/components/logs/LogsTable";
import { createColumns } from "@/components/logs/logs-config";

// Create a context to share functions
const LogsContext = React.createContext<{
	deleteLog: (id: number) => Promise<boolean>;
	refreshLogs: () => Promise<void>;
} | null>(null);

export const useLogsContext = () => {
	const context = React.useContext(LogsContext);
	if (!context) {
		throw new Error("useLogsContext must be used within LogsContext.Provider");
	}
	return context;
};

export default function LogsManagePage() {
	const t = useTranslations("logs");
	const id = useId();
	const params = useParams();
	const searchSpaceId = Number(params.search_space_id);

	const { mutateAsync: deleteLogMutation } = useAtomValue(deleteLogMutationAtom);
	const { mutateAsync: updateLogMutation } = useAtomValue(updateLogMutationAtom);
	const { mutateAsync: createLogMutation } = useAtomValue(createLogMutationAtom);

	const createLog = useCallback(
		async (data: CreateLogRequest) => {
			try {
				await createLogMutation(data);
				return true;
			} catch (error) {
				console.error("Failed to create log:", error);
				return false;
			}
		},
		[createLogMutation]
	);

	const updateLog = useCallback(
		async (logId: number, data: UpdateLogRequest) => {
			try {
				await updateLogMutation({ logId, data });
				return true;
			} catch (error) {
				console.error("Failed to update log:", error);
				return false;
			}
		},
		[updateLogMutation]
	);

	const deleteLog = useCallback(
		async (id: number) => {
			try {
				await deleteLogMutation({ id });
				return true;
			} catch (error) {
				console.error("Failed to delete log:", error);
				return false;
			}
		},
		[deleteLogMutation]
	);

	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 20,
	});

	const { logs, loading: logsLoading, error: logsError, refreshLogs } = useLogs(
		searchSpaceId,
		{},
		{
			skip: pagination.pageIndex * pagination.pageSize,
			limit: pagination.pageSize,
		}
	);
	const {
		summary,
		loading: summaryLoading,
		error: summaryError,
		refreshSummary,
	} = useLogsSummary(searchSpaceId, 24);

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [sorting, setSorting] = useState<SortingState>([
		{
			id: "created_at",
			desc: true,
		},
	]);

	const inputRef = useRef<HTMLInputElement>(null);

	// Create translated columns
	const translatedColumns = useMemo(() => createColumns(t), [t]);

	const table = useReactTable({
		data: logs,
		columns: translatedColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		enableSortingRemoval: false,
		getPaginationRowModel: getPaginationRowModel(),
		onPaginationChange: setPagination,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		state: {
			sorting,
			pagination,
			columnFilters,
			columnVisibility,
		},
	});

	// Get unique values for filters
	const uniqueLevels = useMemo(() => {
		const levelColumn = table.getColumn("level");
		if (!levelColumn) return [];
		return Array.from(levelColumn.getFacetedUniqueValues().keys()).sort();
	}, [table.getColumn]);

	const uniqueStatuses = useMemo(() => {
		const statusColumn = table.getColumn("status");
		if (!statusColumn) return [];
		return Array.from(statusColumn.getFacetedUniqueValues().keys()).sort();
	}, [table.getColumn]);

	const handleDeleteRows = async () => {
		const selectedRows = table.getSelectedRowModel().rows;

		if (selectedRows.length === 0) {
			toast.error("No rows selected");
			return;
		}

		const deletePromises = selectedRows.map((row) => deleteLog(row.original.id));

		try {
			const results = await Promise.all(deletePromises);
			const allSuccessful = results.every((result) => result === true);

			if (allSuccessful) {
				toast.success(`Successfully deleted ${selectedRows.length} log(s)`);
			} else {
				toast.error("Some logs could not be deleted");
			}

			await refreshLogs();
			table.resetRowSelection();
		} catch (error: any) {
			console.error("Error deleting logs:", error);
			toast.error("Error deleting logs");
		}
	};

	const handleRefresh = async () => {
		await Promise.all([refreshLogs(), refreshSummary()]);
		toast.success("Logs refreshed");
	};

	return (
		<LogsContext.Provider
			value={{
				deleteLog: deleteLog || (() => Promise.resolve(false)),
				refreshLogs: () => refreshLogs().then(() => void 0),
			}}
		>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className="w-full px-6 py-4 space-y-6 min-h-[calc(100vh-64px)]"
			>
				{/* Summary Dashboard */}
				<LogsSummaryDashboard
					summary={summary}
					loading={summaryLoading}
					error={summaryError}
					onRefresh={refreshSummary}
				/>

				{/* Logs Table Header */}
				<motion.div
					className="flex items-center justify-between"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
				>
					<div>
						<h2 className="text-xl md:text-2xl font-bold tracking-tight">{t("title")}</h2>
						<p className="text-xs md:text-sm text-muted-foreground">{t("subtitle")}</p>
					</div>
					<Button onClick={handleRefresh} variant="outline" size="sm">
						<RefreshCw className="w-4 h-4 mr-2" />
						{t("refresh")}
					</Button>
				</motion.div>

				{/* Filters */}
				<LogsFilters
					table={table}
					uniqueLevels={uniqueLevels}
					uniqueStatuses={uniqueStatuses}
					inputRef={inputRef}
					onBulkDelete={handleDeleteRows}
					id={id}
				/>

				{/* Logs Table */}
				<LogsTable
					table={table}
					logs={logs}
					loading={logsLoading}
					error={logsError?.message ?? null}
					onRefresh={refreshLogs}
					id={id}
					t={t}
				/>
			</motion.div>
		</LogsContext.Provider>
	);
}

export { LogsContext };
