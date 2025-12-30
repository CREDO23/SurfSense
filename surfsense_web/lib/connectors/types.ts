import type { z } from "zod";
import type { EnumConnectorName } from "@/contracts/enums/connector";

/**
 * Resource selection configuration for multi-step connectors
 */
export interface ResourceSelectionConfig<T = unknown> {
	enabled: true;
	fetchEndpoint: string;
	resourceLabel: string; // e.g., "repositories", "channels", "indexes"
	getDisplayName: (resource: T) => string;
	getId: (resource: T) => string | number;
	multiSelect?: boolean;
	searchable?: boolean;
}

/**
 * Field configuration for dynamic form generation
 */
export interface ConnectorField {
	name: string;
	label: string;
	type: "text" | "password" | "url" | "email" | "number" | "select";
	placeholder?: string;
	description?: string;
	required?: boolean;
	options?: Array<{ label: string; value: string }>; // For select type
}

/**
 * Complete connector configuration
 */
export interface ConnectorConfig<TSchema extends z.ZodType = z.ZodType, TResource = unknown> {
	// Metadata
	connectorType: EnumConnectorName;
	name: string;
	displayName: string;
	description?: string;
	
	// Form configuration
	schema: TSchema;
	defaultValues: Partial<z.infer<TSchema>>;
	fields: ConnectorField[];
	
	// Resource selection (for multi-step connectors like GitHub, Elasticsearch)
	resourceSelection?: ResourceSelectionConfig<TResource>;
	
	// Transform form values to API payload
	transformToConfig: (values: z.infer<TSchema>, selectedResources?: TResource[]) => Record<string, unknown>;
	
	// Help/documentation
	setupInstructions?: Array<{
		title: string;
		steps: string[];
	}>;
}
