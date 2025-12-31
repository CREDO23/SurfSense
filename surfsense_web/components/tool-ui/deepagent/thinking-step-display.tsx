import type { FC } from "react";
import { useMemo } from "react";
import {
	ChainOfThoughtStep,
	ChainOfThoughtTrigger,
	ChainOfThoughtContent,
	ChainOfThoughtItem,
} from "@/components/prompt-kit/chain-of-thought";
import { cn } from "@/lib/utils";
import { STEP_STATUS } from "@/lib/deepagent/constants";
import { getStepIcon } from "@/lib/deepagent/icon-utils";
import type { ThinkingStep } from "@/lib/deepagent/types";

/**
 * Component to display a single thinking step with controlled open state
 */

interface ThinkingStepDisplayProps {
	step: ThinkingStep;
	isOpen: boolean;
	onToggle: () => void;
}

export const ThinkingStepDisplay: FC<ThinkingStepDisplayProps> = ({ step, isOpen, onToggle }) => {
	const icon = useMemo(() => getStepIcon(step.status, step.title), [step.status, step.title]);

	const isInProgress = step.status === STEP_STATUS.IN_PROGRESS;
	const isCompleted = step.status === STEP_STATUS.COMPLETED;

	return (
		<ChainOfThoughtStep open={isOpen} onOpenChange={onToggle}>
			<ChainOfThoughtTrigger
				leftIcon={icon}
				swapIconOnHover={!isInProgress}
				className={cn(
					isInProgress && "text-foreground font-medium",
					isCompleted && "text-muted-foreground"
				)}
			>
				{step.title}
			</ChainOfThoughtTrigger>
			<ChainOfThoughtContent>
				{step.items.map((item, index) => (
					<ChainOfThoughtItem key={`${step.id}-item-${index}`}>{item}</ChainOfThoughtItem>
				))}
			</ChainOfThoughtContent>
		</ChainOfThoughtStep>
	);
};
