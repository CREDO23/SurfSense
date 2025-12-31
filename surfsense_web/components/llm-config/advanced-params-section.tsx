"use client";

import { Sparkles } from "lucide-react";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import InferenceParamsEditor from "../inference-params-editor";

interface AdvancedParamsSectionProps {
	form: any;
}

export function AdvancedParamsSection({ form }: AdvancedParamsSectionProps) {
	return (
		<>
			<Separator />
			<div className="space-y-4">
				<div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
					<Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
					Advanced Parameters
				</div>

				<FormField
					control={form.control}
					name="litellm_params"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<InferenceParamsEditor params={field.value || {}} setParams={field.onChange} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</>
	);
}
