"use client";

import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { ChainOfThought } from "@/components/ui/assistant-ui/chain-of-thought";
import { STEP_STATUS } from "@/lib/deepagent/constants";
import type { ThinkingStep, StepStatus } from "@/lib/deepagent/types";
import { ThinkingStepDisplay } from "./thinking-step-display";

interface SmartChainOfThoughtProps {
	steps: ThinkingStep[];
}

/** Type for tracking step override states */
type StepOverrides = Record<string, boolean>;

/** Type for tracking step status history */
type StepStatusHistory = Record<string, StepStatus>;

/**
 * Smart chain of thought renderer with state management
 */
export const SmartChainOfThought: FC<SmartChainOfThoughtProps> = ({ steps }) => {
	// Track which steps the user has manually toggled
	const [manualOverrides, setManualOverrides] = useState<StepOverrides>({});
	// Track previous step statuses to detect changes
	const prevStatusesRef = useRef<StepStatusHistory>({});

	// Clear manual overrides when a step's status changes
	useEffect(() => {
		const currentStatuses: StepStatusHistory = {};
		steps.forEach((step) => {
			currentStatuses[step.id] = step.status;
			// If status changed, clear any manual override for this step
			const prevStatus = prevStatusesRef.current[step.id];
			if (prevStatus && prevStatus !== step.status) {
				setManualOverrides((prev) => {
					const next = { ...prev };
					delete next[step.id];
					return next;
				});
			}
		});
		prevStatusesRef.current = currentStatuses;
	}, [steps]);

	const getStepOpenState = useCallback(
		(step: ThinkingStep): boolean => {
			// If user has manually toggled, respect that
			if (manualOverrides[step.id] !== undefined) {
				return manualOverrides[step.id];
			}
			// Auto behavior: open if in progress
			if (step.status === STEP_STATUS.IN_PROGRESS) {
				return true;
			}
			// Default: collapsed (all steps collapse when processing is done)
			return false;
		},
		[manualOverrides]
	);

	const handleToggle = useCallback((stepId: string, currentOpen: boolean) => {
		setManualOverrides((prev) => ({
			...prev,
			[stepId]: !currentOpen,
		}));
	}, []);

	return (
		<ChainOfThought>
			{steps.map((step) => {
				const isOpen = getStepOpenState(step);
				return (
					<ThinkingStepDisplay
						key={step.id}
						step={step}
						isOpen={isOpen}
						onToggle={() => handleToggle(step.id, isOpen)}
					/>
				);
			})}
		</ChainOfThought>
	);
};
