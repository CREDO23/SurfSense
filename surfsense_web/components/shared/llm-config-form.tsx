"use client";

import { Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import type { CreateNewLLMConfigRequest } from "@/contracts/types/new-llm-config.types";
import { cn } from "@/lib/utils";
import { useLLMConfigForm } from "@/hooks/use-llm-config-form";
import { SystemInstructionsSection } from "@/components/llm-config/system-instructions-section";
import { ModelConfigSection } from "@/components/llm-config/model-config-section";
import { ModelSelector } from "@/components/llm-config/model-selector";
import { APIConfigSection } from "@/components/llm-config/api-config-section";
import { AdvancedParamsSection } from "@/components/llm-config/advanced-params-section";

export interface LLMConfigFormData extends CreateNewLLMConfigRequest {}

interface LLMConfigFormProps {
	initialData?: Partial<LLMConfigFormData>;
	searchSpaceId: number;
	onSubmit: (data: LLMConfigFormData) => Promise<void>;
	onCancel?: () => void;
	isSubmitting?: boolean;
	mode?: "create" | "edit";
	submitLabel?: string;
	showAdvanced?: boolean;
	compact?: boolean;
}

export function LLMConfigForm({
	initialData,
	searchSpaceId,
	onSubmit,
	onCancel,
	isSubmitting = false,
	mode = "create",
	submitLabel,
	showAdvanced = true,
	compact = false,
}: LLMConfigFormProps) {
	const {
		form,
		watchProvider,
		watchUseDefault,
		defaultInstructions,
		handleResetToDefault,
		handleSystemInstructionsChange,
		handleProviderChange,
		handleSubmit,
	} = useLLMConfigForm({
		initialData,
		searchSpaceId,
		onSubmit,
		mode,
	});

	return (
		<Form {...form}>
			<form onSubmit={handleSubmit} className="space-y-6">
				<SystemInstructionsSection
					form={form}
					onResetToDefault={handleResetToDefault}
					onSystemInstructionsChange={handleSystemInstructionsChange}
					watchUseDefault={watchUseDefault}
					defaultInstructions={defaultInstructions}
					compact={compact}
				/>

				<Separator />

				<ModelConfigSection
					form={form}
					onProviderChange={handleProviderChange}
					watchProvider={watchProvider}
					compact={compact}
				/>

				<ModelSelector form={form} watchProvider={watchProvider} compact={compact} />

				<Separator />

				<APIConfigSection form={form} watchProvider={watchProvider} compact={compact} />

				{showAdvanced && (
					<>
						<Separator />
						<AdvancedParamsSection form={form} />
					</>
				)}

				<div
					className={cn(
						"flex gap-3 pt-4",
						compact ? "justify-end" : "justify-center sm:justify-end"
					)}
				>
					{onCancel && (
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							disabled={isSubmitting}
							className="text-xs sm:text-sm h-9 sm:h-10"
						>
							Cancel
						</Button>
					)}
					<Button
						type="submit"
						disabled={isSubmitting}
						className="gap-2 min-w-[140px] sm:min-w-[160px] text-xs sm:text-sm h-9 sm:h-10"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
								{mode === "edit" ? "Updating..." : "Creating..."}
							</>
						) : (
							<>
								{!compact && <Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
								{submitLabel ?? (mode === "edit" ? "Update Configuration" : "Create Configuration")}
							</>
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}
