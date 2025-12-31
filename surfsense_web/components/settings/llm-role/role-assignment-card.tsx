import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Bot } from "lucide-react";

interface LLMConfig {
	id: number;
	name: string;
	provider: string;
	model_name: string;
	api_base?: string;
	is_global?: boolean;
}

interface RoleAssignmentCardProps {
	roleKey: string;
	roleInfo: {
		icon: LucideIcon;
		title: string;
		description: string;
		color: string;
		examples: string;
		characteristics: string[];
	};
	assignedConfigId: string | number;
	availableConfigs: LLMConfig[];
	globalConfigs: LLMConfig[];
	newLLMConfigs: LLMConfig[];
	onRoleAssignment: (role: string, configId: string) => void;
	index: number;
}

export function RoleAssignmentCard({
	roleKey,
	roleInfo,
	assignedConfigId,
	availableConfigs,
	globalConfigs,
	newLLMConfigs,
	onRoleAssignment,
	index,
}: RoleAssignmentCardProps) {
	const RoleIcon = roleInfo.icon;
	const currentAssignment = assignedConfigId;
	const assignedConfig = availableConfigs.find((c) => c.id.toString() === currentAssignment?.toString());

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.1 }}
			key={roleKey}
		>
			<Card className="border shadow-sm hover:shadow-md transition-all">
				<CardHeader className="pb-3 md:pb-4">
					<CardTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg">
						<div className={`p-1.5 md:p-2 rounded-md ${roleInfo.color}`}>
							<RoleIcon className="w-4 h-4 md:w-5 md:h-5" />
						</div>
						<span className="text-sm md:text-base">{roleInfo.title}</span>
					</CardTitle>
					<CardDescription className="mt-1.5 md:mt-2 text-xs md:text-sm leading-relaxed">
						{roleInfo.description}
					</CardDescription>
					<div className="mt-2 md:mt-3 text-[10px] md:text-xs text-muted-foreground">
						<span className="font-medium">Use cases:</span> {roleInfo.examples}
					</div>
					<div className="mt-1.5 md:mt-2 flex flex-wrap gap-1">
						{roleInfo.characteristics.map((char) => (
							<Badge
								key={char}
								variant="secondary"
								className="text-[9px] md:text-[10px] py-0 md:py-0.5"
							>
								{char}
							</Badge>
						))}
					</div>
				</CardHeader>
				<CardContent className="space-y-2 md:space-y-3">
					<div className="space-y-1.5 md:space-y-2">
						<Label htmlFor={`${roleKey}_select`} className="text-xs md:text-sm font-medium">
							Assign LLM Configuration:
						</Label>
						<Select
							value={currentAssignment?.toString() || "unassigned"}
							onValueChange={(value) => onRoleAssignment(`${roleKey}_llm_id`, value)}
						>
							<SelectTrigger className="h-9 md:h-10 text-xs md:text-sm">
								<SelectValue placeholder="Select an LLM configuration" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="unassigned">
									<span className="text-muted-foreground">Unassigned</span>
								</SelectItem>

								{globalConfigs.length > 0 && (
									<>
										<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
											Global Configurations
										</div>
										{globalConfigs.map((config) => (
											<SelectItem key={config.id} value={config.id.toString()}>
												<div className="flex items-center gap-2">
													<Badge variant="outline" className="text-xs">
														{config.provider}
													</Badge>
													<span>{config.name}</span>
													<span className="text-muted-foreground">({config.model_name})</span>
													<Badge variant="secondary" className="text-xs">
														🌐 Global
													</Badge>
												</div>
											</SelectItem>
										))}
									</>
								)}

								{newLLMConfigs.length > 0 && (
									<>
										<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
											Your Configurations
										</div>
										{newLLMConfigs
											.filter((config) => config.id && config.id.toString().trim() !== "")
											.map((config) => (
												<SelectItem key={config.id} value={config.id.toString()}>
													<div className="flex items-center gap-2">
														<Badge variant="outline" className="text-xs">
															{config.provider}
														</Badge>
														<span>{config.name}</span>
														<span className="text-muted-foreground">({config.model_name})</span>
													</div>
												</SelectItem>
											))}
									</>
								)}
							</SelectContent>
						</Select>
					</div>

					{assignedConfig && (
						<div className="mt-2 md:mt-3 p-2 md:p-3 bg-muted/50 rounded-lg">
							<div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm flex-wrap">
								<Bot className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
								<span className="font-medium">Assigned:</span>
								<Badge variant="secondary" className="text-[10px] md:text-xs">
									{assignedConfig.provider}
								</Badge>
								<span>{assignedConfig.name}</span>
								{"is_global" in assignedConfig && assignedConfig.is_global && (
									<Badge variant="outline" className="text-[9px] md:text-xs">
										🌐 Global
									</Badge>
								)}
							</div>
							<div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
								Model: {assignedConfig.model_name}
							</div>
							{assignedConfig.api_base && (
								<div className="text-[10px] md:text-xs text-muted-foreground">
									Base: {assignedConfig.api_base}
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
}
