"use client";

import { Key } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface APIConfigSectionProps {
	form: any;
	watchProvider: string;
	selectedProvider: any;
}

export function APIConfigSection({ form, watchProvider, selectedProvider }: APIConfigSectionProps) {
	return (
		<>
			<div className="grid gap-4 sm:grid-cols-2">
				<FormField
					control={form.control}
					name="api_key"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="flex items-center gap-2 text-xs sm:text-sm">
								<Key className="h-3.5 w-3.5 text-amber-500" />
								API Key
							</FormLabel>
							<FormControl>
								<Input
									type="password"
									placeholder={watchProvider === "OLLAMA" ? "Any value" : "sk-..."}
									{...field}
								/>
							</FormControl>
							{watchProvider === "OLLAMA" && (
								<FormDescription className="text-[10px] sm:text-xs">
									Ollama doesn't require auth — enter any value
								</FormDescription>
							)}
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="api_base"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="flex items-center gap-2 text-xs sm:text-sm">
								API Base URL
								{selectedProvider?.apiBase && (
									<Badge variant="secondary" className="text-[10px]">
										Auto-filled
									</Badge>
								)}
							</FormLabel>
							<FormControl>
								<Input
									placeholder={selectedProvider?.apiBase || "https://api.example.com/v1"}
									{...field}
									value={field.value ?? ""}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<AnimatePresence>
				{watchProvider === "OLLAMA" && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="flex flex-wrap gap-2"
					>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-7 text-xs"
							onClick={() => form.setValue("api_base", "http://localhost:11434")}
						>
							localhost:11434
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-7 text-xs"
							onClick={() => form.setValue("api_base", "http://host.docker.internal:11434")}
						>
							Docker
						</Button>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
