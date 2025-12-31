import { AlertCircle, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EditorErrorStateProps {
	error: string;
	searchSpaceId: number;
	onBack: () => void;
}

export function EditorErrorState({ error, searchSpaceId, onBack }: EditorErrorStateProps) {
	return (
		<div className="flex items-center justify-center min-h-[400px] p-6">
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
				<Card className="border-destructive/50">
					<CardHeader>
						<div className="flex items-center gap-2">
							<AlertCircle className="h-5 w-5 text-destructive" />
							<CardTitle className="text-destructive">Error</CardTitle>
						</div>
						<CardDescription>{error}</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={onBack} variant="outline" className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							Back
						</Button>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}
