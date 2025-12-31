import { IconMessage, IconMicrophone, IconSearch, IconUsers } from "@tabler/icons-react";
import React from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { CitationIllustration } from "@/components/homepage/illustrations/citation-illustration";
import { CollaborationIllustration } from "@/components/homepage/illustrations/collaboration-illustration";
import { AnnotationIllustration } from "@/components/homepage/illustrations/annotation-illustration";
import { AudioCommentIllustration } from "@/components/homepage/illustrations/audio-comment-illustration";

export function FeaturesBentoGrid() {
	return (
		<BentoGrid className="max-w-7xl my-8 mx-auto md:auto-rows-[20rem]">
			{items.map((item, i) => (
				<BentoGridItem
					key={i}
					title={item.title}
					description={item.description}
					header={item.header}
					className={item.className}
					icon={item.icon}
				/>
			))}
		</BentoGrid>
	);
}

const items = [
	{
		title: "Find, Ask, Act",
		description:
			"Get instant information, detailed updates, and cited answers across company and personal knowledge.",
		header: <CitationIllustration />,
		className: "md:col-span-2",
		icon: <IconSearch className="h-4 w-4 text-neutral-500" />,
	},
	{
		title: "Work Together in Real Time",
		description:
			"Transform your company docs into multiplayer spaces with live edits, synced content, and presence.",
		header: <CollaborationIllustration />,
		className: "md:col-span-1",
		icon: <IconUsers className="h-4 w-4 text-neutral-500" />,
	},
	{
		title: "Collaborate Beyond Text",
		description:
			"Create podcasts and multimedia your team can comment on, share, and refine together.",
		header: <AudioCommentIllustration />,
		className: "md:col-span-1",
		icon: <IconMicrophone className="h-4 w-4 text-neutral-500" />,
	},
	{
		title: "Context Where It Counts",
		description: "Add comments directly to your chats and docs for clear, in-the-moment feedback.",
		header: <AnnotationIllustration />,
		className: "md:col-span-2",
		icon: <IconMessage className="h-4 w-4 text-neutral-500" />,
	},
];
