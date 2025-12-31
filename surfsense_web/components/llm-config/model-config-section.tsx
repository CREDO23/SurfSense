"use client";

import { Bot, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { LLM_PROVIDERS } from "@/contracts/enums/llm-providers";

interface ModelConfigSectionProps {
	form: any;
	watchProvider: string;
	onProviderChange: (value: string) => void;
}

export function ModelConfigSection({
	form,
	watchProvider,
	onProviderChange,
}: ModelConfigSectionProps) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
				<Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
				Model Configuration
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="flex items-center gap-2 text-xs sm:text-sm">
								<Sparkles className="h-3.5 w-3.5 text-violet-500" />
								Configuration Name
							</FormLabel>
							<FormControl>
								<Input
									placeholder="e.g., My GPT-4 Agent"
									className="transition-all focus-visible:ring-violet-500/50"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-muted-foreground text-xs sm:text-sm">
								Description
								<Badge variant="outline" className="ml-2 text-[10px]">
									Optional
								</Badge>
							</FormLabel>
							<FormControl>
								<Input placeholder="Brief description" {...field} value={field.value ?? ""} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<FormField
				control={form.control}
				name="provider"
				render={({ field }) => (
					<FormItem>
						<FormLabel className="text-xs sm:text-sm">LLM Provider</FormLabel>
						<Select value={field.value} onValueChange={onProviderChange}>
							<FormControl>
								<SelectTrigger className="transition-all focus:ring-violet-500/50">
									<SelectValue placeholder="Select a provider" />
								</SelectTrigger>
							</FormControl>
							<SelectContent className="max-h-[300px]">
								{LLM_PROVIDERS.map((provider) => (
									<SelectItem key={provider.value} value={provider.value}>
										<div className="flex flex-col py-0.5">
											<span className="font-medium">{provider.label}</span>
											<span className="text-xs text-muted-foreground">
												{provider.description}
											</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>

			<AnimatePresence>
				{watchProvider === "CUSTOM" && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
					>
						<FormField
							control={form.control}
							name="custom_provider"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-xs sm:text-sm">Custom Provider Name</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g., my-custom-provider"
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
