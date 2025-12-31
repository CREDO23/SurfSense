"use client";

// Re-export everything from the modularized files
export {
	useSidebar,
	SidebarProvider,
	type SidebarContext,
	SIDEBAR_WIDTH,
	SIDEBAR_WIDTH_MOBILE,
	SIDEBAR_WIDTH_ICON,
	SIDEBAR_KEYBOARD_SHORTCUT,
} from "./sidebar-context";

export {
	Sidebar,
	SidebarTrigger,
	SidebarRail,
	SidebarInset,
	SidebarInput,
	SidebarHeader,
	SidebarFooter,
	SidebarSeparator,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupAction,
	SidebarGroupContent,
} from "./sidebar-components";

export {
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
	SidebarMenuAction,
	SidebarMenuBadge,
	SidebarMenuSkeleton,
	SidebarMenuSub,
	SidebarMenuSubItem,
	SidebarMenuSubButton,
} from "./sidebar-menu";
