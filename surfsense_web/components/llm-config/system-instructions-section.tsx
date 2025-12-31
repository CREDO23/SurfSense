"use client";

import { MessageSquareQuote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface SystemInstructionsSectionProps {
	form: any;
	defaultInstructions: any;
	watchUseDefault: boolean;
	onResetToDefault: () => void;
	onSystemInstructionsChange: (value: string) => void;
}

export function SystemInstructionsSection({
	form,
	defaultInstructions,
	watchUseDefault,
	onResetToDefault,
	onSystemInstructionsChange,
}: SystemInstructionsSectionProps) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
				<MessageSquareQuote className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
				System Instructions
			</div>

			<FormField
				control={form.control}
				name="system_instructions"
				render={({ field }) => (
					<FormItem>
						<div className="flex items-center justify-between">
							<FormLabel className="text-xs sm:text-sm">Instructions for the AI</FormLabel>
							{defaultInstructions && !watchUseDefault && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={onResetToDefault}
									className="h-7 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground"
								>
									Reset to Default
								</Button>
							)}
						</div>
						<FormControl>
							<Textarea
								placeholder="Enter system instructions for the AI..."
								rows={6}
								className="font-mono text-[11px] sm:text-xs resize-none"
								{...field}
								onChange={(e) => {
									field.onChange(e);
									onSystemInstructionsChange(e.target.value);
								}}
							/>
						</FormControl>
						<FormDescription className="text-[10px] sm:text-xs">
							Use {"{resolved_today}"} to include today's date dynamically
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="citations_enabled"
				render={({ field }) => (
					<FormItem className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
						<div className="space-y-0.5">
							<FormLabel className="text-xs sm:text-sm font-medium">Enable Citations</FormLabel>
							<FormDescription className="text-[10px] sm:text-xs">
								Include [citation:id] references to source documents
							</FormDescription>
						</div>
						<FormControl>
							<Switch checked={field.value} onCheckedChange={field.onChange} />
						</FormControl>
					</FormItem>
				)}
			/>
		</div>
	);
}
