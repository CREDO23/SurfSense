"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getModelsByProvider } from "@/contracts/enums/llm-models";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
	form: any;
	watchProvider: string;
	selectedProvider: any;
}

export function ModelSelector({ form, watchProvider, selectedProvider }: ModelSelectorProps) {
	const [modelComboboxOpen, setModelComboboxOpen] = useState(false);
	const availableModels = watchProvider ? getModelsByProvider(watchProvider) : [];

	return (
		<FormField
			control={form.control}
			name="model_name"
			render={({ field }) => (
				<FormItem className="flex flex-col">
					<FormLabel className="text-xs sm:text-sm">Model Name</FormLabel>
					<Popover open={modelComboboxOpen} onOpenChange={setModelComboboxOpen}>
						<PopoverTrigger asChild>
							<FormControl>
								<Button
									variant="outline"
									role="combobox"
									aria-expanded={modelComboboxOpen}
									className={cn(
										"w-full justify-between font-normal",
										!field.value && "text-muted-foreground"
									)}
								>
									{field.value || "Select or type model name"}
									<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
								</Button>
							</FormControl>
						</PopoverTrigger>
						<PopoverContent className="w-full p-0" align="start">
							<Command shouldFilter={false}>
								<CommandInput
									placeholder={selectedProvider?.example || "Type model name..."}
									value={field.value}
									onValueChange={field.onChange}
								/>
								<CommandList>
									<CommandEmpty>
										<div className="py-3 text-center text-sm text-muted-foreground">
											{field.value ? `Using: "${field.value}"` : "Type your model name"}
										</div>
									</CommandEmpty>
									{availableModels.length > 0 && (
										<CommandGroup heading="Suggested Models">
											{availableModels
												.filter(
													(model) =>
														!field.value ||
														model.value.toLowerCase().includes(field.value.toLowerCase())
												)
												.slice(0, 8)
												.map((model) => (
													<CommandItem
														key={model.value}
														value={model.value}
														onSelect={(value) => {
															field.onChange(value);
															setModelComboboxOpen(false);
														}}
														className="py-2"
													>
														<Check
															className={cn(
																"mr-2 h-4 w-4",
																field.value === model.value ? "opacity-100" : "opacity-0"
															)}
														/>
														<div>
															<div className="font-medium">{model.label}</div>
															{model.contextWindow && (
																<div className="text-xs text-muted-foreground">
																	Context: {model.contextWindow}
																</div>
															)}
														</div>
													</CommandItem>
												))}
										</CommandGroup>
									)}
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
					{selectedProvider?.example && (
						<FormDescription className="text-[10px] sm:text-xs">
							Example: {selectedProvider.example}
						</FormDescription>
					)}
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
