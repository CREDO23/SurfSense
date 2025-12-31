"use client";

import { useAtomValue } from "jotai";
import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	deleteConnectorMutationAtom,
	indexConnectorMutationAtom,
	updateConnectorMutationAtom,
} from "@/atoms/connectors/connector-mutation.atoms";
import { connectorsAtom } from "@/atoms/connectors/connector-query.atoms";
import { ConnectorsTable } from "@/components/connectors/connectors-table";
import { DateRangeIndexingDialog } from "@/components/connectors/date-range-indexing-dialog";
import { DeleteConnectorDialog } from "@/components/connectors/delete-connector-dialog";
import { PeriodicIndexingDialog } from "@/components/connectors/periodic-indexing-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConnectorsPage() {
	const t = useTranslations("connectors");
	const tCommon = useTranslations("common");

	// Helper function to format date with time
	const formatDateTime = (dateString: string | null): string => {
		if (!dateString) return t("never");

		const date = new Date(dateString);
		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
	};
	const router = useRouter();
	const params = useParams();
	const searchSpaceId = params.search_space_id as string;
	const today = new Date();

	const { data: connectors = [], isLoading, error } = useAtomValue(connectorsAtom);

	const { mutateAsync: deleteConnector } = useAtomValue(deleteConnectorMutationAtom);
	const { mutateAsync: indexConnector } = useAtomValue(indexConnectorMutationAtom);
	const { mutateAsync: updateConnector } = useAtomValue(updateConnectorMutationAtom);

	const [connectorToDelete, setConnectorToDelete] = useState<number | null>(null);
	const [indexingConnectorId, setIndexingConnectorId] = useState<number | null>(null);
	const [datePickerOpen, setDatePickerOpen] = useState(false);
	const [selectedConnectorForIndexing, setSelectedConnectorForIndexing] = useState<number | null>(
		null
	);
	const [startDate, setStartDate] = useState<Date | undefined>(undefined);
	const [endDate, setEndDate] = useState<Date | undefined>(undefined);

	// Periodic indexing state
	const [periodicDialogOpen, setPeriodicDialogOpen] = useState(false);
	const [selectedConnectorForPeriodic, setSelectedConnectorForPeriodic] = useState<number | null>(
		null
	);
	const [periodicEnabled, setPeriodicEnabled] = useState(false);
	const [frequencyMinutes, setFrequencyMinutes] = useState<string>("1440");
	const [customFrequency, setCustomFrequency] = useState<string>("");
	const [isSavingPeriodic, setIsSavingPeriodic] = useState(false);

	useEffect(() => {
		if (error) {
			toast.error(t("failed_load"));
			console.error("Error fetching connectors:", error);
		}
	}, [error, t]);

	// Handle connector deletion
	const handleDeleteConnector = async () => {
		if (connectorToDelete === null) return;

		try {
			await deleteConnector({ id: connectorToDelete });
		} catch (error) {
			console.error("Error deleting connector:", error);
		} finally {
			setConnectorToDelete(null);
		}
	};

	// Handle opening date picker for indexing
	const handleOpenDatePicker = (connectorId: number) => {
		setSelectedConnectorForIndexing(connectorId);
		setDatePickerOpen(true);
	};

	// Handle connector indexing with dates
	const handleIndexConnector = async () => {
		if (selectedConnectorForIndexing === null) return;

		setDatePickerOpen(false);

		try {
			setIndexingConnectorId(selectedConnectorForIndexing);
			const startDateStr = startDate ? format(startDate, "yyyy-MM-dd") : undefined;
			const endDateStr = endDate ? format(endDate, "yyyy-MM-dd") : undefined;

			await indexConnector({
				connector_id: selectedConnectorForIndexing,
				queryParams: {
					search_space_id: searchSpaceId,
					start_date: startDateStr,
					end_date: endDateStr,
				},
			});
			toast.success(t("indexing_started"));
		} catch (error) {
			console.error("Error indexing connector content:", error);
			toast.error(error instanceof Error ? error.message : t("indexing_failed"));
		} finally {
			setIndexingConnectorId(null);
			setSelectedConnectorForIndexing(null);
			setStartDate(undefined);
			setEndDate(undefined);
		}
	};

	// Handle indexing without date picker (for quick indexing)
	const handleQuickIndexConnector = async (connectorId: number) => {
		setIndexingConnectorId(connectorId);
		try {
			await indexConnector({
				connector_id: connectorId,
				queryParams: {
					search_space_id: searchSpaceId,
				},
			});
			toast.success(t("indexing_started"));
		} catch (error) {
			console.error("Error indexing connector content:", error);
			toast.error(error instanceof Error ? error.message : t("indexing_failed"));
		} finally {
			setIndexingConnectorId(null);
		}
	};

	// Handle opening periodic indexing dialog
	const handleOpenPeriodicDialog = (connectorId: number) => {
		const connector = connectors.find((c) => c.id === connectorId);
		if (!connector) return;

		setSelectedConnectorForPeriodic(connectorId);
		setPeriodicEnabled(connector.periodic_indexing_enabled);

		if (connector.indexing_frequency_minutes) {
			// Check if it's a preset value
			const presetValues = ["15", "60", "360", "720", "1440", "10080"];
			if (presetValues.includes(connector.indexing_frequency_minutes.toString())) {
				setFrequencyMinutes(connector.indexing_frequency_minutes.toString());
				setCustomFrequency("");
			} else {
				setFrequencyMinutes("custom");
				setCustomFrequency(connector.indexing_frequency_minutes.toString());
			}
		} else {
			setFrequencyMinutes("1440");
			setCustomFrequency("");
		}

		setPeriodicDialogOpen(true);
	};

	// Handle saving periodic indexing configuration
	const handleSavePeriodicIndexing = async () => {
		if (selectedConnectorForPeriodic === null) return;

		const connector = connectors.find((c) => c.id === selectedConnectorForPeriodic);
		if (!connector) return;

		setIsSavingPeriodic(true);
		try {
			// Determine the frequency value
			let frequency: number | null = null;
			if (periodicEnabled) {
				if (frequencyMinutes === "custom") {
					frequency = parseInt(customFrequency, 10);
					if (isNaN(frequency) || frequency <= 0) {
						toast.error("Please enter a valid frequency in minutes");
						setIsSavingPeriodic(false);
						return;
					}
				} else {
					frequency = parseInt(frequencyMinutes, 10);
				}
			}

			await updateConnector({
				id: selectedConnectorForPeriodic,
				data: {
					periodic_indexing_enabled: periodicEnabled,
					indexing_frequency_minutes: frequency,
				},
			});

			toast.success(
				periodicEnabled
					? "Periodic indexing enabled successfully"
					: "Periodic indexing disabled successfully"
			);
			setPeriodicDialogOpen(false);
		} catch (error) {
			console.error("Error updating periodic indexing:", error);
			toast.error(error instanceof Error ? error.message : "Failed to update periodic indexing");
		} finally {
			setIsSavingPeriodic(false);
			setSelectedConnectorForPeriodic(null);
		}
	};

	// Format frequency for display
	const formatFrequency = (minutes: number): string => {
		if (minutes < 60) return `${minutes}m`;
		if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
		if (minutes < 10080) return `${Math.floor(minutes / 1440)}d`;
		return `${Math.floor(minutes / 10080)}w`;
	};

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl min-h-[calc(100vh-64px)]">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="mb-8 flex items-center justify-between gap-2"
			>
				<div>
					<h1 className="text-xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
					<p className="text-xs md:text-base text-muted-foreground mt-2">{t("subtitle")}</p>
				</div>
				<Button
					className="h-8 text-xs px-3 md:h-10 md:text-sm md:px-4"
					onClick={() => router.push(`/dashboard/${searchSpaceId}/connectors/add`)}
				>
					<Plus className="mr-2 h-3 w-3 md:h-4 md:w-4" />
					{t("add_connector")}
				</Button>
			</motion.div>

			<Card>
				<CardHeader className="pb-3">
					<CardTitle>{t("your_connectors")}</CardTitle>
					<CardDescription>{t("view_manage")}</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex justify-center py-8">
							<div className="animate-pulse text-center">
								<div className="h-6 w-32 bg-muted rounded mx-auto mb-2"></div>
								<div className="h-4 w-48 bg-muted rounded mx-auto"></div>
							</div>
						</div>
					) : connectors.length === 0 ? (
						<div className="text-center py-12">
							<h3 className="text-lg font-medium mb-2">{t("no_connectors")}</h3>
							<p className="text-muted-foreground mb-6">{t("no_connectors_desc")}</p>
							<Button onClick={() => router.push(`/dashboard/${searchSpaceId}/connectors/add`)}>
								<Plus className="mr-2 h-4 w-4" />
								{t("add_first")}
							</Button>
						</div>
					) : (
						<ConnectorsTable
							connectors={connectors}
							searchSpaceId={searchSpaceId}
							indexingConnectorId={indexingConnectorId}
							formatDateTime={formatDateTime}
							formatFrequency={formatFrequency}
							onOpenDatePicker={handleOpenDatePicker}
							onOpenPeriodicDialog={handleOpenPeriodicDialog}
							onDelete={setConnectorToDelete}
						/>
					)}
				</CardContent>
			</Card>

			<DeleteConnectorDialog
				open={connectorToDelete !== null}
				onOpenChange={(open) => !open && setConnectorToDelete(null)}
				isDeleting={false}
				onConfirm={handleDeleteConnector}
			/>

			<DateRangeIndexingDialog
				open={datePickerOpen}
				onOpenChange={setDatePickerOpen}
				startDate={startDate}
				endDate={endDate}
				onStartDateChange={setStartDate}
				onEndDateChange={setEndDate}
				onClearDates={() => {
					setStartDate(undefined);
					setEndDate(undefined);
				}}
				onSelectLast30Days={() => {
					const thirtyDaysAgo = new Date(today);
					thirtyDaysAgo.setDate(today.getDate() - 30);
					setStartDate(thirtyDaysAgo);
					setEndDate(today);
				}}
				onSelectLastYear={() => {
					const yearAgo = new Date(today);
					yearAgo.setFullYear(today.getFullYear() - 1);
					setStartDate(yearAgo);
					setEndDate(today);
				}}
				onConfirm={handleIndexConnector}
			/>

			<PeriodicIndexingDialog
				open={periodicDialogOpen}
				onOpenChange={setPeriodicDialogOpen}
				periodicEnabled={periodicEnabled}
				onPeriodicEnabledChange={setPeriodicEnabled}
				frequencyMinutes={frequencyMinutes}
				onFrequencyMinutesChange={setFrequencyMinutes}
				customFrequency={customFrequency}
				onCustomFrequencyChange={setCustomFrequency}
				isSaving={isSavingPeriodic}
				onConfirm={handleSavePeriodicIndexing}
			/>
		</div>
	);
}
