"use client";

import { useAtomValue } from "jotai";
import { memo, useState } from "react";
import { currentUserAtom } from "@/atoms/user/user-query.atoms";
import { useSidebarNavigation } from "@/hooks/use-sidebar-navigation";
import { UserDropdownMenu } from "@/components/sidebar/user-dropdown-menu";

import { NavChats } from "@/components/sidebar/nav-chats";
import { NavMain } from "@/components/sidebar/nav-main";
import { NavNotes } from "@/components/sidebar/nav-notes";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { PageUsageDisplay } from "@/components/sidebar/page-usage-display";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const defaultData = {
	user: {
		name: "Surf",
		email: "m@example.com",
		avatar: "/icon-128.png",
	},
	navMain: [
		{
			title: "Chat",
			url: "#",
			icon: "SquareTerminal",
			isActive: true,
			items: [],
		},
		{
			title: "Sources",
			url: "#",
			icon: "Database",
			items: [
				{
					title: "Add Sources",
					url: "#",
				},
				{
					title: "Manage Documents",
					url: "#",
				},
				{
					title: "Manage Connectors",
					url: "#",
				},
			],
		},
	],
	navSecondary: [
		{
			title: "SEARCH SPACE",
			url: "#",
			icon: "LifeBuoy",
		},
	],
	RecentChats: [
		{
			name: "Design Engineering",
			url: "#",
			icon: "MessageCircleMore",
			id: 1001,
		},
		{
			name: "Sales & Marketing",
			url: "#",
			icon: "MessageCircleMore",
			id: 1002,
		},
		{
			name: "Travel",
			url: "#",
			icon: "MessageCircleMore",
			id: 1003,
		},
	],
	RecentNotes: [
		{
			name: "Meeting Notes",
			url: "#",
			icon: "FileText",
			id: 2001,
		},
		{
			name: "Project Ideas",
			url: "#",
			icon: "FileText",
			id: 2002,
		},
	],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	searchSpaceId?: string;
	navMain?: {
		title: string;
		url: string;
		icon: string;
		isActive?: boolean;
		items?: {
			title: string;
			url: string;
		}[];
	}[];
	navSecondary?: {
		title: string;
		url: string;
		icon: string;
	}[];
	RecentChats?: {
		name: string;
		url: string;
		icon: string;
		id?: number;
		search_space_id?: number;
		actions?: {
			name: string;
			icon: string;
			onClick: () => void;
		}[];
	}[];
	RecentNotes?: {
		name: string;
		url: string;
		icon: string;
		id?: number;
		search_space_id?: number;
		actions?: {
			name: string;
			icon: string;
			onClick: () => void;
		}[];
	}[];
	user?: {
		name: string;
		email: string;
		avatar: string;
	};
	pageUsage?: {
		pagesUsed: number;
		pagesLimit: number;
	};
	onAddNote?: () => void;
}

// Memoized AppSidebar component for better performance
export const AppSidebar = memo(function AppSidebar({
	searchSpaceId,
	navMain = defaultData.navMain,
	navSecondary = defaultData.navSecondary,
	RecentChats = defaultData.RecentChats,
	RecentNotes = defaultData.RecentNotes,
	pageUsage,
	onAddNote,
	...props
}: AppSidebarProps) {
	const { data: user, isPending: isLoadingUser } = useAtomValue(currentUserAtom);
	const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);

	const { processedNavMain, processedNavSecondary, processedRecentChats, processedRecentNotes } =
		useSidebarNavigation(navMain, navSecondary, RecentChats, RecentNotes);

	return (
		<Sidebar variant="inset" collapsible="icon" aria-label="Main navigation" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<UserDropdownMenu
							email={user?.email}
							isLoading={isLoadingUser}
							searchSpaceId={searchSpaceId}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent className="gap-1">
				<NavMain items={processedNavMain} onSourcesExpandedChange={setIsSourcesExpanded} />

				<NavChats
					chats={processedRecentChats}
					searchSpaceId={searchSpaceId}
					isSourcesExpanded={isSourcesExpanded}
				/>

				<NavNotes
					notes={processedRecentNotes}
					onAddNote={onAddNote}
					searchSpaceId={searchSpaceId}
					isSourcesExpanded={isSourcesExpanded}
				/>
			</SidebarContent>
			<SidebarFooter>
				{pageUsage && (
					<PageUsageDisplay pagesUsed={pageUsage.pagesUsed} pagesLimit={pageUsage.pagesLimit} />
				)}
				<NavSecondary items={processedNavSecondary} className="mt-auto" />
			</SidebarFooter>
		</Sidebar>
	);
});
