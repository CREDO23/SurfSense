"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, ChevronDown, ChevronUp, Terminal } from "lucide-react";
import { flexRender } from "@tanstack/react-table";
import type { Log } from "@/contracts/types/log.types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { LogsPagination } from "./LogsPagination";

interface LogsTableProps {
	table: any;
	logs: Log[];
	loading: boolean;
	error: string | null;
	onRefresh: () => void;
	id: string;
	t: (key: string, params?: any) => string;
	columns: any[];
}

export function LogsTable({
	table,
	logs,
	loading,
	error,
	onRefresh,
	id,
	t,
	columns,
}: LogsTableProps) {
	if (loading) {
		return (
			<motion.div
				className="rounded-md border"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
			>
				<div className="flex h-[400px] w-full items-center justify-center">
					<div className="flex flex-col items-center gap-2">
						<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
						<p className="text-sm text-muted-foreground">Loading logs...</p>
					</div>
				</div>
			</motion.div>
		);
	}

	if (error) {
		return (
			<motion.div
				className="rounded-md border"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
			>
				<div className="flex h-[400px] w-full items-center justify-center">
					<div className="flex flex-col items-center gap-2">
						<AlertCircle className="h-8 w-8 text-destructive" />
						<p className="text-sm text-destructive">Error loading logs</p>
						<Button variant="outline" size="sm" onClick={onRefresh}>
							Retry
						</Button>
					</div>
				</div>
			</motion.div>
		);
	}

	if (logs.length === 0) {
		return (
			<motion.div
				className="rounded-md border"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
			>
				<div className="flex h-[400px] w-full items-center justify-center">
					<div className="flex flex-col items-center gap-2">
						<Terminal className="h-8 w-8 text-muted-foreground" />
						<p className="text-sm text-muted-foreground">{t("no_logs")}</p>
					</div>
				</div>
			</motion.div>
		);
	}

	return (
		<>
			<motion.div
				className="rounded-md border overflow-hidden"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
			>
				<Table className="table-fixed">
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup: any) => (
							<TableRow key={headerGroup.id} className="hover:bg-transparent">
								{headerGroup.headers.map((header: any) => (
									<TableHead
										key={header.id}
										style={{ width: `${header.getSize()}px` }}
										className={cn(
											"h-12 px-4 py-3",
											header.column.id === "select" ? "ps-4 pe-0" : "",
											header.column.id === "created_at" ? "whitespace-nowrap text-right" : ""
										)}
									>
										{header.isPlaceholder ? null : header.column.getCanSort() ? (
											<Button
												variant="ghost"
												size="sm"
												className="flex h-full cursor-pointer select-none items-center justify-between gap-2"
												onClick={header.column.getToggleSortingHandler()}
											>
												{flexRender(header.column.columnDef.header, header.getContext())}
												{{
													asc: <ChevronUp className="shrink-0 opacity-60" size={16} />,
													desc: <ChevronDown className="shrink-0 opacity-60" size={16} />,
												}[header.column.getIsSorted() as string] ?? null}
											</Button>
										) : (
											flexRender(header.column.columnDef.header, header.getContext())
										)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						<AnimatePresence mode="popLayout">
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row: any, index: number) => (
									<motion.tr
										key={row.id}
										initial={{ opacity: 0, y: 10 }}
										animate={{
											opacity: 1,
											y: 0,
											transition: {
												type: "spring",
												stiffness: 300,
												damping: 30,
												delay: index * 0.03,
											},
										}}
										exit={{ opacity: 0, y: -10 }}
										className={cn(
											"border-b transition-colors hover:bg-muted/50",
											row.getIsSelected() ? "bg-muted/50" : ""
										)}
									>
										{row.getVisibleCells().map((cell: any) => {
											const isCreatedAt = cell.column.id === "created_at";
											const isMessage = cell.column.id === "message";
											return (
												<TableCell
													key={cell.id}
													className={cn(
														"px-4 py-3 align-middle",
														cell.column.id === "select" ? "ps-4 pe-0" : "overflow-hidden",
														isCreatedAt
															? "whitespace-nowrap text-xs text-muted-foreground text-right"
															: "",
														isMessage ? "overflow-hidden" : ""
													)}
												>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</TableCell>
											);
										})}
									</motion.tr>
								))
							) : (
								<TableRow>
									<TableCell colSpan={columns.length} className="h-24 text-center">
										{t("no_logs")}
									</TableCell>
								</TableRow>
							)}
						</AnimatePresence>
					</TableBody>
				</Table>
			</motion.div>

			<LogsPagination table={table} id={id} t={t} />
		</>
	);
}
