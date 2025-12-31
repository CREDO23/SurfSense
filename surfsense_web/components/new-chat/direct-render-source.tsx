import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DirectRenderSourceProps {
	title: string;
	description?: string;
	url?: string;
}

export function DirectRenderSource({ title, description, url }: DirectRenderSourceProps) {
	return (
		<div className="flex flex-col gap-3 p-6">
			<h2 className="text-xl font-semibold">{title}</h2>
			{description && <p className="text-muted-foreground">{description}</p>}
			{url && (
				<Button
					variant="outline"
					size="sm"
					className="w-fit"
					asChild
				>
					<a href={url} target="_blank" rel="noopener noreferrer">
						Visit Source
						<ExternalLink className="ml-2 size-4" />
					</a>
				</Button>
			)}
		</div>
	);
}
