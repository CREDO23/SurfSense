"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
import { CircleX, ListFilter, Filter, Columns3, Trash, CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { fadeInScale } from "./logs-config";
import { cn } from "@/lib/utils";

interface LogsFiltersProps {
	table: any;
	uniqueLevels: string[];
	uniqueStatuses: string[];
	inputRef: React.RefObject<HTMLInputElement | null>;
	onBulkDelete: () => Promise<void>;
	id: string;
}

export function LogsFilters({
	table,
	uniqueLevels,
	uniqueStatuses,
	inputRef,
	onBulkDelete,
	id,
}: LogsFiltersProps) {
	const t = useTranslations("logs");
	return (
		<motion.div
			className="flex flex-wrap items-center justify-start gap-3 w-full"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.2 }}
		>
			<div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
				{/* Search Input */}
				<motion.div className="relative w-full sm:w-auto" variants={fadeInScale}>
					<Input
						ref={inputRef}
						className={cn(
							"peer w-full sm:min-w-60 ps-9",
							Boolean(table.getColumn("message")?.getFilterValue()) && "pe-9"
						)}
						value={(table.getColumn("message")?.getFilterValue() ?? "") as string}
						onChange={(e) => table.getColumn("message")?.setFilterValue(e.target.value)}
						placeholder={t("filter_by_message")}
						type="text"
					/>
					<div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
						<ListFilter size={16} strokeWidth={2} />
					</div>
					{Boolean(table.getColumn("message")?.getFilterValue()) && (
						<Button
							className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 hover:text-foreground"
							variant="ghost"
							size="icon"
							onClick={() => {
								table.getColumn("message")?.setFilterValue("");
								inputRef.current?.focus();
							}}
						>
							<CircleX size={16} strokeWidth={2} />
						</Button>
					)}
				</motion.div>

				{/* Level Filter */}
				<FilterDropdown
					title={t("level")}
					column={table.getColumn("level")}
					options={uniqueLevels}
					id={`${id}-level`}
					t={t}
				/>

				{/* Status Filter */}
				<FilterDropdown
					title={t("status")}
					column={table.getColumn("status")}
					options={uniqueStatuses}
					id={`${id}-status`}
					t={t}
				/>

				{/* Column Visibility */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline">
							<Columns3 className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} />
							{t("view")}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>{t("toggle_columns")}</DropdownMenuLabel>
						{table
							.getAllColumns()
							.filter((column: any) => column.getCanHide())
							.map((column: any) => (
								<DropdownMenuCheckboxItem
									key={column.id}
									className="capitalize"
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}
									onSelect={(event) => event.preventDefault()}
								>
									{column.id}
								</DropdownMenuCheckboxItem>
							))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto">
				{table.getSelectedRowModel().rows.length > 0 && (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button className="w-full sm:w-auto" variant="outline">
								<Trash className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} />
								{t("delete_selected")}
								<span className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
									{table.getSelectedRowModel().rows.length}
								</span>
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border">
									<CircleAlert className="opacity-80" size={16} strokeWidth={2} />
								</div>
								<AlertDialogHeader>
									<AlertDialogTitle>{t("confirm_title")}</AlertDialogTitle>
									<AlertDialogDescription>
										{t("confirm_delete_desc", { count: table.getSelectedRowModel().rows.length })}
									</AlertDialogDescription>
								</AlertDialogHeader>
							</div>
							<AlertDialogFooter>
								<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
								<AlertDialogAction onClick={onBulkDelete}>{t("delete")}</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
			</div>
		</motion.div>
	);
}

function FilterDropdown({
	title,
	column,
	options,
	id,
	t,
}: {
	title: string;
	column: any;
	options: string[];
	id: string;
	t: (key: string) => string;
}) {
	const selectedValues = useMemo(() => {
		const filterValue = column?.getFilterValue() as string[];
		return filterValue ?? [];
	}, [column]);

	const handleValueChange = (checked: boolean, value: string) => {
		const filterValue = column?.getFilterValue() as string[];
		const newFilterValue = filterValue ? [...filterValue] : [];

		if (checked) {
			newFilterValue.push(value);
		} else {
			const index = newFilterValue.indexOf(value);
			if (index > -1) {
				newFilterValue.splice(index, 1);
			}
		}

		column?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline">
					<Filter className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} />
					{title}
					{selectedValues.length > 0 && (
						<span className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
							{selectedValues.length}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="min-w-36 p-3" align="start">
				<div className="space-y-3">
					<div className="text-xs font-medium text-muted-foreground">
						{t("filter_by")} {title}
					</div>
					<div className="space-y-2">
						{options.map((value, i) => (
							<div key={value} className="flex items-center gap-2">
								<Checkbox
									id={`${id}-${i}`}
									checked={selectedValues.includes(value)}
									onCheckedChange={(checked: boolean) => handleValueChange(checked, value)}
								/>
								<Label htmlFor={`${id}-${i}`} className="text-sm font-normal">
									{value}
								</Label>
							</div>
						))}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
