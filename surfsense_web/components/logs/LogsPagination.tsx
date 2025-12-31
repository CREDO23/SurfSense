"use client";

import { motion } from "motion/react";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LogsPaginationProps {
	table: any;
	id: string;
	t: (key: string) => string;
}

export function LogsPagination({ table, id, t }: LogsPaginationProps) {
	return (
		<div className="flex items-center justify-between gap-8 mt-6">
			<motion.div
				className="flex items-center gap-3"
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
			>
				<Label htmlFor={id} className="max-sm:sr-only">
					{t("rows_per_page")}
				</Label>
				<Select
					value={table.getState().pagination.pageSize.toString()}
					onValueChange={(value) => table.setPageSize(Number(value))}
				>
					<SelectTrigger id={id} className="w-fit whitespace-nowrap">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{[10, 20, 50, 100].map((pageSize) => (
							<SelectItem key={pageSize} value={pageSize.toString()}>
								{pageSize}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</motion.div>

			<motion.div
				className="flex grow justify-end whitespace-nowrap text-sm text-muted-foreground"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2 }}
			>
				<p className="whitespace-nowrap text-sm text-muted-foreground">
					<span className="text-foreground">
						{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
						{Math.min(
							table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
								table.getState().pagination.pageSize,
							table.getRowCount()
						)}
					</span>{" "}
					of <span className="text-foreground">{table.getRowCount()}</span>
				</p>
			</motion.div>

			<div>
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<Button
								size="icon"
								variant="outline"
								onClick={() => table.firstPage()}
								disabled={!table.getCanPreviousPage()}
							>
								<ChevronFirst size={16} />
							</Button>
						</PaginationItem>
						<PaginationItem>
							<Button
								size="icon"
								variant="outline"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								<ChevronLeft size={16} />
							</Button>
						</PaginationItem>
						<PaginationItem>
							<Button
								size="icon"
								variant="outline"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								<ChevronRight size={16} />
							</Button>
						</PaginationItem>
						<PaginationItem>
							<Button
								size="icon"
								variant="outline"
								onClick={() => table.lastPage()}
								disabled={!table.getCanNextPage()}
							>
								<ChevronLast size={16} />
							</Button>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</div>
		</div>
	);
}
