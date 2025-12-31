import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SupportedTypesCardProps {
	supportedExtensions: string[];
}

export function SupportedTypesCard({ supportedExtensions }: SupportedTypesCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Info className="h-5 w-5" />
					Supported File Types
				</CardTitle>
				<CardDescription>
					You can upload the following file formats
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap gap-2">
					{supportedExtensions.map((ext) => (
						<Badge key={ext} variant="secondary">
							{ext}
						</Badge>
					))}
				</div>
				<Alert className="mt-4">
					<AlertDescription className="text-sm">
						Files are processed automatically and added to your search space.
					</AlertDescription>
				</Alert>
			</CardContent>
		</Card>
	);
}
