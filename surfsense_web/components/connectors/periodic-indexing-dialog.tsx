"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface PeriodicIndexingDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	periodicEnabled: boolean;
	onPeriodicEnabledChange: (enabled: boolean) => void;
	frequencyMinutes: string;
	onFrequencyMinutesChange: (value: string) => void;
	customFrequency: string;
	onCustomFrequencyChange: (value: string) => void;
	isSaving: boolean;
	onConfirm: () => void;
}

export function PeriodicIndexingDialog({
	open,
	onOpenChange,
	periodicEnabled,
	onPeriodicEnabledChange,
	frequencyMinutes,
	onFrequencyMinutesChange,
	customFrequency,
	onCustomFrequencyChange,
	isSaving,
	onConfirm,
}: PeriodicIndexingDialogProps) {
	const t = useTranslations("connectors");
	const tCommon = useTranslations("common");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Configure Periodic Indexing</DialogTitle>
					<DialogDescription>
						Enable automatic indexing of this connector at regular intervals.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="flex items-center justify-between space-x-2">
						<Label htmlFor="periodic-enabled" className="flex flex-col space-y-1">
							<span>Enable Periodic Indexing</span>
							<span className="text-sm text-muted-foreground font-normal">
								Automatically index this connector
							</span>
						</Label>
						<Switch
							id="periodic-enabled"
							checked={periodicEnabled}
							onCheckedChange={onPeriodicEnabledChange}
						/>
					</div>

					{periodicEnabled && (
						<>
							<div className="space-y-2">
								<Label htmlFor="frequency">Frequency</Label>
								<Select value={frequencyMinutes} onValueChange={onFrequencyMinutesChange}>
									<SelectTrigger id="frequency">
										<SelectValue placeholder="Select frequency" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="15">Every 15 minutes</SelectItem>
										<SelectItem value="60">Every hour</SelectItem>
										<SelectItem value="360">Every 6 hours</SelectItem>
										<SelectItem value="720">Every 12 hours</SelectItem>
										<SelectItem value="1440">Daily</SelectItem>
										<SelectItem value="10080">Weekly</SelectItem>
										<SelectItem value="custom">Custom</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{frequencyMinutes === "custom" && (
								<div className="space-y-2">
									<Label htmlFor="custom-frequency">Custom Frequency (minutes)</Label>
									<Input
										id="custom-frequency"
										type="number"
										value={customFrequency}
										onChange={(e) => onCustomFrequencyChange(e.target.value)}
										placeholder="Enter frequency in minutes"
										min="1"
									/>
								</div>
							)}
						</>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
						{tCommon("cancel")}
					</Button>
					<Button onClick={onConfirm} disabled={isSaving}>
						{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
