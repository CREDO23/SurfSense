"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { defaultSystemInstructionsAtom } from "@/atoms/new-llm-config/new-llm-config-query.atoms";
import { LLM_PROVIDERS } from "@/contracts/enums/llm-providers";
import type { CreateNewLLMConfigRequest } from "@/contracts/types/new-llm-config.types";

const formSchema = z.object({
	name: z.string().min(1, "Name is required").max(100),
	description: z.string().max(500).optional().nullable(),
	provider: z.string().min(1, "Provider is required"),
	custom_provider: z.string().max(100).optional().nullable(),
	model_name: z.string().min(1, "Model name is required").max(100),
	api_key: z.string().min(1, "API key is required"),
	api_base: z.string().max(500).optional().nullable(),
	litellm_params: z.record(z.string(), z.any()).optional().nullable(),
	system_instructions: z.string().optional().default(""),
	use_default_system_instructions: z.boolean().default(true),
	citations_enabled: z.boolean().default(true),
	search_space_id: z.number(),
});

type FormValues = z.infer<typeof formSchema>;

interface UseLLMConfigFormProps {
	initialData?: Partial<CreateNewLLMConfigRequest>;
	searchSpaceId: number;
	mode?: "create" | "edit";
	onSubmit: (data: FormValues) => Promise<void>;
}

export function useLLMConfigForm({
	initialData,
	searchSpaceId,
	mode = "create",
	onSubmit,
}: UseLLMConfigFormProps) {
	const { data: defaultInstructions, isSuccess: defaultInstructionsLoaded } = useAtomValue(
		defaultSystemInstructionsAtom
	);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: initialData?.name ?? "",
			description: initialData?.description ?? "",
			provider: initialData?.provider ?? "",
			custom_provider: initialData?.custom_provider ?? "",
			model_name: initialData?.model_name ?? "",
			api_key: initialData?.api_key ?? "",
			api_base: initialData?.api_base ?? "",
			litellm_params: initialData?.litellm_params ?? {},
			system_instructions: initialData?.system_instructions ?? "",
			use_default_system_instructions: initialData?.use_default_system_instructions ?? true,
			citations_enabled: initialData?.citations_enabled ?? true,
			search_space_id: searchSpaceId,
		},
	});

	// Load default instructions when available (only for new configs)
	useEffect(() => {
		if (
			mode === "create" &&
			defaultInstructionsLoaded &&
			defaultInstructions?.default_system_instructions &&
			!form.getValues("system_instructions")
		) {
			form.setValue("system_instructions", defaultInstructions.default_system_instructions);
		}
	}, [defaultInstructionsLoaded, defaultInstructions, mode, form]);

	const watchProvider = form.watch("provider");
	const watchUseDefault = form.watch("use_default_system_instructions");

	const handleResetToDefault = () => {
		if (defaultInstructions?.default_system_instructions) {
			form.setValue("system_instructions", defaultInstructions.default_system_instructions);
			form.setValue("use_default_system_instructions", true);
		}
	};

	const handleSystemInstructionsChange = (value: string) => {
		const isDefault = value === defaultInstructions?.default_system_instructions;
		form.setValue("use_default_system_instructions", isDefault);
	};

	const handleProviderChange = (value: string) => {
		form.setValue("provider", value);
		form.setValue("model_name", "");

		// Auto-fill API base for certain providers
		const provider = LLM_PROVIDERS.find((p) => p.value === value);
		if (provider?.apiBase) {
			form.setValue("api_base", provider.apiBase);
		}
	};

	const handleSubmit = async (values: FormValues) => {
		await onSubmit(values);
	};

	return {
		form,
		watchProvider,
		watchUseDefault,
		defaultInstructions,
		handleResetToDefault,
		handleSystemInstructionsChange,
		handleProviderChange,
		handleSubmit,
	};
}
