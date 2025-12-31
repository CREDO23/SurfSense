import { useMemo } from "react";
import {
	BookOpen,
	Cable,
	Database,
	FileStack,
	FileText,
	type LucideIcon,
	MessageCircleMore,
	SquareTerminal,
	Undo2,
	AlertCircle,
	Info,
	ExternalLink,
	Trash2,
	Podcast,
	Users,
	RefreshCw,
	Settings2,
	SquareLibrary,
} from "lucide-react";

// Map of icon names to their components
export const iconMap: Record<string, LucideIcon> = {
	BookOpen,
	Cable,
	Database,
	FileStack,
	Undo2,
	MessageCircleMore,
	Settings2,
	SquareLibrary,
	FileText,
	SquareTerminal,
	AlertCircle,
	Info,
	ExternalLink,
	Trash2,
	Podcast,
	Users,
	RefreshCw,
};

interface NavItem {
	title: string;
	url: string;
	icon: string;
	isActive?: boolean;
	items?: { title: string; url: string }[];
}

interface ChatOrNoteItem {
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
}

/**
 * Custom hook to process sidebar navigation items and resolve icon names to components
 */
export function useSidebarNavigation(
	navMain: NavItem[],
	navSecondary: NavItem[],
	RecentChats?: ChatOrNoteItem[],
	RecentNotes?: ChatOrNoteItem[]
) {
	// Process navMain to resolve icon names to components
	const processedNavMain = useMemo(() => {
		return navMain.map((item) => ({
			...item,
			icon: iconMap[item.icon] || SquareTerminal,
		}));
	}, [navMain]);

	// Process navSecondary to resolve icon names to components
	const processedNavSecondary = useMemo(() => {
		return navSecondary.map((item) => ({
			...item,
			icon: iconMap[item.icon] || Undo2,
		}));
	}, [navSecondary]);

	// Process RecentChats to resolve icon names to components
	const processedRecentChats = useMemo(() => {
		return (
			RecentChats?.map((item) => ({
				...item,
				icon: iconMap[item.icon] || MessageCircleMore,
			})) || []
		);
	}, [RecentChats]);

	// Process RecentNotes to resolve icon names to components
	const processedRecentNotes = useMemo(() => {
		return (
			RecentNotes?.map((item) => ({
				...item,
				icon: iconMap[item.icon] || FileText,
			})) || []
		);
	}, [RecentNotes]);

	return {
		processedNavMain,
		processedNavSecondary,
		processedRecentChats,
		processedRecentNotes,
	};
}
