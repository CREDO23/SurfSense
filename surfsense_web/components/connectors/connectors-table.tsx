"use client";

import { format } from "date-fns";
import {
	Calendar as CalendarIcon,
	Clock,
	Edit,
	Loader2,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getConnectorIcon } from "@/contracts/enums/connectorIcons";
import type { SearchSourceConnector } from "@/types/connectors";

interface ConnectorsTableProps {
	connectors: SearchSourceConnector[];
	searchSpaceId: string;
	indexingConnectorId: number | null;
	formatDateTime: (dateString: string | null) => string;
	formatFrequency: (minutes: number) => string;
	onOpenDatePicker: (connectorId: number) => void;
	onOpenPeriodicDialog: (connectorId: number) => void;
	onDelete: (connectorId: number) => void;
}

export function ConnectorsTable({
	connectors,
	searchSpaceId,
	indexingConnectorId,
	formatDateTime,
	formatFrequency,
	onOpenDatePicker,
	onOpenPeriodicDialog,
	onDelete,
}: ConnectorsTableProps) {
	const t = useTranslations("connectors");
	const router = useRouter();

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t("name")}</TableHead>
						<TableHead>{t("type")}</TableHead>
						<TableHead>{t("last_indexed")}</TableHead>
						<TableHead>{t("periodic")}</TableHead>
						<TableHead className="text-right">{t("actions")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{connectors.map((connector) => (
						<TableRow key={connector.id}>
							<TableCell className="font-medium">{connector.name}</TableCell>
							<TableCell>{getConnectorIcon(connector.connector_type)}</TableCell>
							<TableCell>
								{connector.is_indexable
									? formatDateTime(connector.last_indexed_at)
									: t("not_indexable")}
							</TableCell>
							<TableCell>
								{connector.is_indexable ? (
									connector.periodic_indexing_enabled ? (
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<div className="flex items-center gap-1 text-green-600 dark:text-green-400">
														<Clock className="h-4 w-4" />
														<span className="text-sm font-medium">
															{connector.indexing_frequency_minutes
																? formatFrequency(connector.indexing_frequency_minutes)
																: "Enabled"}
														</span>
													</div>
												</TooltipTrigger>
												<TooltipContent>
													<p>
														Runs every {connector.indexing_frequency_minutes} minutes
														{connector.next_scheduled_at && (
															<>
																<br />
																Next: {formatDateTime(connector.next_scheduled_at)}
															</>
														)}
													</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									) : (
										<span className="text-sm text-muted-foreground">Disabled</span>
									)
								) : (
									<span className="text-sm text-muted-foreground">-</span>
								)}
							</TableCell>
							<TableCell className="text-right">
								<div className="flex justify-end gap-2">
									{connector.is_indexable && (
										<div className="flex gap-1">
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															variant="outline"
															size="sm"
															onClick={() => onOpenDatePicker(connector.id)}
															disabled={indexingConnectorId === connector.id}
														>
															{indexingConnectorId === connector.id ? (
																<RefreshCw className="h-4 w-4 animate-spin" />
															) : (
																<CalendarIcon className="h-4 w-4" />
															)}
															<span className="sr-only">{t("index_date_range")}</span>
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														<p>{t("index_date_range")}</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															variant="outline"
															size="sm"
															onClick={() => onOpenPeriodicDialog(connector.id)}
														>
															<Clock className="h-4 w-4" />
															<span className="sr-only">Configure periodic indexing</span>
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														<p>Configure periodic indexing</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</div>
									)}
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														router.push(
															`/dashboard/${searchSpaceId}/connectors/${connector.id}/edit`
														)
													}
												>
													<Edit className="h-4 w-4" />
													<span className="sr-only">{t("edit")}</span>
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												<p>{t("edit")}</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="outline"
													size="sm"
													onClick={() => onDelete(connector.id)}
												>
													<Trash2 className="h-4 w-4" />
													<span className="sr-only">{t("delete")}</span>
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												<p>{t("delete")}</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
