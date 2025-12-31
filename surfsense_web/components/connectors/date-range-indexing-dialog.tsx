"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangeIndexingDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	startDate: Date | undefined;
	endDate: Date | undefined;
	onStartDateChange: (date: Date | undefined) => void;
	onEndDateChange: (date: Date | undefined) => void;
	onClearDates: () => void;
	onSelectLast30Days: () => void;
	onSelectLastYear: () => void;
	onConfirm: () => void;
}

export function DateRangeIndexingDialog({
	open,
	onOpenChange,
	startDate,
	endDate,
	onStartDateChange,
	onEndDateChange,
	onClearDates,
	onSelectLast30Days,
	onSelectLastYear,
	onConfirm,
}: DateRangeIndexingDialogProps) {
	const t = useTranslations("connectors");
	const tCommon = useTranslations("common");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{t("select_date_range")}</DialogTitle>
					<DialogDescription>{t("select_date_range_desc")}</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="start-date">{t("start_date")}</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										id="start-date"
										variant="outline"
										className={cn(
											"w-full justify-start text-left font-normal",
											!startDate && "text-muted-foreground"
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{startDate ? format(startDate, "PPP") : t("pick_date")}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar mode="single" selected={startDate} onSelect={onStartDateChange} initialFocus />
								</PopoverContent>
							</Popover>
						</div>
						<div className="space-y-2">
							<Label htmlFor="end-date">{t("end_date")}</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										id="end-date"
										variant="outline"
										className={cn(
											"w-full justify-start text-left font-normal",
											!endDate && "text-muted-foreground"
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{endDate ? format(endDate, "PPP") : t("pick_date")}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar mode="single" selected={endDate} onSelect={onEndDateChange} initialFocus />
								</PopoverContent>
							</Popover>
						</div>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" size="sm" onClick={onClearDates}>
							{t("clear_dates")}
						</Button>
						<Button variant="outline" size="sm" onClick={onSelectLast30Days}>
							{t("last_30_days")}
						</Button>
						<Button variant="outline" size="sm" onClick={onSelectLastYear}>
							{t("last_year")}
						</Button>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{tCommon("cancel")}
					</Button>
					<Button onClick={onConfirm}>{t("start_indexing")}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
