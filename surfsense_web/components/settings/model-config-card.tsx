import { Bot, Clock, Edit3, FileText, MessageSquareQuote, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { NewLLMConfig } from "@/contracts/types/new-llm-config.types";

interface ModelConfigCardProps {
	config: NewLLMConfig;
	onEdit: (config: NewLLMConfig) => void;
	onDelete: (config: NewLLMConfig) => void;
	item: { hidden: { opacity: number; y: number }; show: { opacity: number; y: number } };
}

export function ModelConfigCard({ config, onEdit, onDelete, item }: ModelConfigCardProps) {
	return (
		<motion.div
			key={config.id}
			variants={item}
			layout
			exit={{ opacity: 0, scale: 0.95 }}
		>
			<Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-muted-foreground/10 hover:border-violet-500/30">
				<CardContent className="p-0">
					<div className="flex">
						{/* Left accent bar */}
						<div className="w-1 md:w-1.5 transition-colors bg-gradient-to-b from-violet-500/50 to-purple-500/50 group-hover:from-violet-500 group-hover:to-purple-500" />

						<div className="flex-1 p-3 md:p-5">
							<div className="flex items-start justify-between gap-2 md:gap-4">
								{/* Main content */}
								<div className="flex items-start gap-2 md:gap-4 flex-1 min-w-0">
									<div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg md:rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 group-hover:from-violet-500/20 group-hover:to-purple-500/20 transition-colors shrink-0">
										<Bot className="h-5 w-5 md:h-6 md:w-6 text-violet-600 dark:text-violet-400" />
									</div>
									<div className="flex-1 min-w-0 space-y-2 md:space-y-3">
										{/* Title row */}
										<div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
											<h4 className="text-sm md:text-base font-semibold tracking-tight truncate">
												{config.name}
											</h4>
											<div className="flex items-center gap-1 md:gap-1.5 flex-wrap">
												<Badge
													variant="secondary"
													className="text-[9px] md:text-[10px] font-medium px-1.5 md:px-2 py-0.5 bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20"
												>
													{config.provider}
												</Badge>
												{config.citations_enabled && (
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger>
																<Badge
																	variant="outline"
																	className="text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
																>
																	<MessageSquareQuote className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
																	Citations
																</Badge>
															</TooltipTrigger>
															<TooltipContent>Citations are enabled for this configuration</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												)}
												{!config.use_default_system_instructions && config.system_instructions && (
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger>
																<Badge
																	variant="outline"
																	className="text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 border-blue-500/30 text-blue-700 dark:text-blue-300"
																>
																	<FileText className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
																	Custom
																</Badge>
															</TooltipTrigger>
															<TooltipContent>Using custom system instructions</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												)}
											</div>
										</div>

										{/* Model name */}
										<code className="text-[10px] md:text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md inline-block">
											{config.model_name}
										</code>

										{/* Description if any */}
										{config.description && (
											<p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1">
												{config.description}
											</p>
										)}

										{/* Footer row */}
										<div className="flex items-center gap-2 md:gap-4 pt-1">
											<div className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-muted-foreground">
												<Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
												<span>{new Date(config.created_at).toLocaleDateString()}</span>
											</div>
										</div>
									</div>
								</div>

								{/* Actions */}
								<div className="flex items-center gap-0.5 md:gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => onEdit(config)}
													className="h-7 w-7 md:h-8 md:w-8 p-0 text-muted-foreground hover:text-foreground"
												>
													<Edit3 className="h-3.5 w-3.5 md:h-4 md:w-4" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>Edit</TooltipContent>
										</Tooltip>
									</TooltipProvider>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => onDelete(config)}
													className="h-7 w-7 md:h-8 md:w-8 p-0 text-muted-foreground hover:text-destructive"
												>
													<Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
												</Button>
											</TooltipTrigger>
											<TooltipContent>Delete</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
