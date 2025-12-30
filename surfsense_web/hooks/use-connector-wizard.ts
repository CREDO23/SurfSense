import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import { toast } from "sonner";
import { createConnectorMutationAtom } from "@/atoms/connectors/connector-mutation.atoms";
import type { ConnectorConfig } from "@/lib/connectors/types";
import type { z } from "zod";

type WizardStep = "credentials" | "resources" | "complete";

interface UseConnectorWizardProps<TSchema extends z.ZodType, TResource> {
	config: ConnectorConfig<TSchema, TResource>;
	searchSpaceId: string;
}

interface UseConnectorWizardReturn<TResource> {
	// State
	currentStep: WizardStep;
	isSubmitting: boolean;
	isFetchingResources: boolean;
	availableResources: TResource[];
	selectedResources: TResource[];
	
	// Actions
	goBack: () => void;
	submitCredentials: (values: Record<string, unknown>) => Promise<void>;
	selectResource: (resource: TResource) => void;
	deselectResource: (resource: TResource) => void;
	finalizeConnector: () => Promise<void>;
}

export function useConnectorWizard<TSchema extends z.ZodType, TResource = unknown>({
	config,
	searchSpaceId,
}: UseConnectorWizardProps<TSchema, TResource>): UseConnectorWizardReturn<TResource> {
	const router = useRouter();
	const { mutateAsync: createConnector } = useAtomValue(createConnectorMutationAtom);
	
	const [currentStep, setCurrentStep] = useState<WizardStep>("credentials");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isFetchingResources, setIsFetchingResources] = useState(false);
	const [availableResources, setAvailableResources] = useState<TResource[]>([]);
	const [selectedResources, setSelectedResources] = useState<TResource[]>([]);
	const [credentialsValues, setCredentialsValues] = useState<Record<string, unknown> | null>(null);
	
	/**
	 * Go back to previous step or connectors page
	 */
	const goBack = useCallback(() => {
		if (currentStep === "resources") {
			setCurrentStep("credentials");
		} else {
			router.push(`/dashboard/${searchSpaceId}/connectors`);
		}
	}, [currentStep, router, searchSpaceId]);
	
	/**
	 * Submit credentials and either fetch resources or create connector directly
	 */
	const submitCredentials = useCallback(async (values: Record<string, unknown>) => {
		setIsSubmitting(true);
		setCredentialsValues(values);
		
		try {
			// If resource selection is enabled, fetch resources
			if (config.resourceSelection?.enabled) {
				setIsFetchingResources(true);
				
				try {
					// Fetch resources using the configured endpoint
					const configData = config.transformToConfig(values as z.infer<TSchema>, []);
					
					// Call the backend endpoint to fetch resources
					const response = await fetch(
						`/api/connectors/${config.connectorType}/resources?search_space_id=${searchSpaceId}`,
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify(configData),
						}
					);
					
					if (!response.ok) {
						throw new Error("Failed to fetch resources");
					}
					
					const resources = await response.json();
					setAvailableResources(resources);
					setCurrentStep("resources");
				} catch (error) {
					console.error("Error fetching resources:", error);
					toast.error(
						error instanceof Error
							? error.message
							: "Failed to fetch resources. Please check your credentials."
					);
				} finally {
					setIsFetchingResources(false);
				}
			} else {
				// No resource selection, create connector directly
				await createFinalConnector(values as z.infer<TSchema>, []);
			}
		} finally {
			setIsSubmitting(false);
		}
	}, [config, searchSpaceId]);
	
	/**
	 * Select a resource for inclusion in the connector
	 */
	const selectResource = useCallback((resource: TResource) => {
		if (config.resourceSelection?.multiSelect) {
			setSelectedResources(prev => [...prev, resource]);
		} else {
			setSelectedResources([resource]);
		}
	}, [config.resourceSelection]);
	
	/**
	 * Deselect a resource
	 */
	const deselectResource = useCallback((resource: TResource) => {
		if (!config.resourceSelection) return;
		
		const resourceId = config.resourceSelection.getId(resource);
		setSelectedResources(prev => 
			prev.filter(r => config.resourceSelection!.getId(r) !== resourceId)
		);
	}, [config.resourceSelection]);
	
	/**
	 * Finalize connector creation with selected resources
	 */
	const finalizeConnector = useCallback(async () => {
		if (!credentialsValues) return;
		
		setIsSubmitting(true);
		try {
			await createFinalConnector(credentialsValues as z.infer<TSchema>, selectedResources);
		} finally {
			setIsSubmitting(false);
		}
	}, [credentialsValues, selectedResources]);
	
	/**
	 * Create the connector via API
	 */
	const createFinalConnector = async (
		values: z.infer<TSchema>,
		resources: TResource[]
	) => {
		try {
			const connectorConfig = config.transformToConfig(values, resources);
			
			await createConnector({
				data: {
					name: (values as any).name || config.displayName,
					connector_type: config.connectorType,
					config: connectorConfig,
					is_indexable: true,
					last_indexed_at: null,
					periodic_indexing_enabled: false,
					indexing_frequency_minutes: null,
					next_scheduled_at: null,
				},
				queryParams: {
					search_space_id: searchSpaceId,
				},
			});
			
			toast.success(`${config.displayName} created successfully!`);
			setCurrentStep("complete");
			
			// Navigate back to connectors page
			setTimeout(() => {
				router.push(`/dashboard/${searchSpaceId}/connectors`);
			}, 1500);
		} catch (error) {
			console.error("Error creating connector:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to create connector"
			);
			throw error;
		}
	};
	
	return {
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
	};
}
