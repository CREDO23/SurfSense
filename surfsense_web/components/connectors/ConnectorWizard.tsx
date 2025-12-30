"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getConnectorIcon } from "@/contracts/enums/connectorIcons";
import { useConnectorWizard } from "@/hooks/use-connector-wizard";
import type { ConnectorConfig, ConnectorField } from "@/lib/connectors/types";

interface ConnectorWizardProps<TSchema extends z.ZodType, TResource> {
	config: ConnectorConfig<TSchema, TResource>;
	searchSpaceId: string;
}

export function ConnectorWizard<TSchema extends z.ZodType, TResource>({
	config,
	searchSpaceId,
}: ConnectorWizardProps<TSchema, TResource>) {
	const {
		currentStep,
		isSubmitting,
		isFetchingResources,
		availableResources,
		selectedResources,
		goBack,
		submitCredentials,
		selectResource,
		deselectResource,
		finalizeConnector,
	} = useConnectorWizard<TSchema, TResource>({ config, searchSpaceId });

	const form = useForm<z.infer<TSchema>>({
		resolver: zodResolver(config.schema),
		defaultValues: config.defaultValues as z.infer<TSchema>,
	});

	const onSubmit = async (values: z.infer<TSchema>) => {
		await submitCredentials(values as Record<string, unknown>);
	};

	const ConnectorIcon = getConnectorIcon(config.connectorType);

	if (currentStep === "complete") {
		return (
			<div className="container mx-auto max-w-2xl py-8">
				<Card>
					<CardHeader className="text-center">
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ type: "spring", stiffness: 200, damping: 15 }}
							className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900"
						>
							<Check className="h-8 w-8 text-green-600 dark:text-green-400" />
						</motion.div>
						<CardTitle>Connector Created Successfully!</CardTitle>
						<CardDescription>
							Your {config.displayName} has been set up and is ready to use.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	if (currentStep === "resources") {
		return (
			<div className="container mx-auto max-w-3xl py-8">
				<Button
					variant="ghost"
					onClick={goBack}
					className="mb-4"
					disabled={isSubmitting}
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back
				</Button>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<ConnectorIcon className="h-8 w-8" />
							<div>
								<CardTitle>
									Select {config.resourceSelection?.resourceLabel || "Resources"}
								</CardTitle>
								<CardDescription>
									Choose which {config.resourceSelection?.resourceLabel} to include
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{isFetchingResources ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-8 w-8 animate-spin" />
								<span className="ml-2">Loading resources...</span>
							</div>
						) : (
							<div className="space-y-2">
								{availableResources.map((resource) => {
									const resourceId = config.resourceSelection!.getId(resource);
									const displayName = config.resourceSelection!.getDisplayName(resource);
									const isSelected = selectedResources.some(
										(r) => config.resourceSelection!.getId(r) === resourceId
									);

									return (
										<Button
											key={String(resourceId)}
											variant={isSelected ? "default" : "outline"}
											className="w-full justify-start"
											onClick={() => {
												if (isSelected) {
													deselectResource(resource);
												} else {
													selectResource(resource);
												}
											}}
										>
											{isSelected && <Check className="mr-2 h-4 w-4" />}
											{displayName}
										</Button>
									);
								})}
							</div>
						)}
					</CardContent>
					<CardFooter>
						<Button
							onClick={finalizeConnector}
							disabled={isSubmitting || selectedResources.length === 0}
							className="w-full"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating Connector...
								</>
							) : (
								"Create Connector"
							)}
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	// Credentials step
	return (
		<div className="container mx-auto max-w-2xl py-8">
			<Button
				variant="ghost"
				onClick={goBack}
				className="mb-4"
				disabled={isSubmitting || isFetchingResources}
			>
				<ArrowLeft className="mr-2 h-4 w-4" />
				Back
			</Button>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<ConnectorIcon className="h-8 w-8" />
						<div>
							<CardTitle>Configure {config.displayName}</CardTitle>
							{config.description && (
								<CardDescription>{config.description}</CardDescription>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							{config.fields.map((field) => (
								<FormField
									key={field.name}
									control={form.control}
									name={field.name as any}
									render={({ field: formField }) => (
										<FormItem>
											<FormLabel>{field.label}</FormLabel>
											<FormControl>
												<Input
													{...formField}
													type={field.type === "password" ? "password" : "text"}
													placeholder={field.placeholder}
												/>
											</FormControl>
											{field.description && (
												<FormDescription>{field.description}</FormDescription>
											)}
											<FormMessage />
										</FormItem>
									)}
								/>
							))}

							<Button
								type="submit"
								disabled={isSubmitting || isFetchingResources}
								className="w-full"
							>
								{isSubmitting || isFetchingResources ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										{isFetchingResources ? "Fetching Resources..." : "Creating Connector..."}
									</>
								) : config.resourceSelection?.enabled ? (
									"Next: Select Resources"
								) : (
									"Create Connector"
								)}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
