"use client";

import {
	ChevronsUpDown,
	LogOut,
	MoonIcon,
	Settings2,
	SquareLibrary,
	SunIcon,
	UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { UserAvatar } from "@/lib/utils/avatar-utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";

interface UserDropdownMenuProps {
	email?: string;
	isLoading?: boolean;
	searchSpaceId?: string;
}

export function UserDropdownMenu({ email, isLoading, searchSpaceId }: UserDropdownMenuProps) {
	const router = useRouter();
	const { theme, setTheme } = useTheme();
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	const userDisplayName = email ? email.split("@")[0] : "User";
	const userEmail = email || (isLoading ? "Loading..." : "Unknown");

	const handleLogout = () => {
		try {
			if (typeof window !== "undefined") {
				localStorage.removeItem("surfsense_bearer_token");
				router.push("/");
			}
		} catch (error) {
			console.error("Error during logout:", error);
			router.push("/");
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuButton
					size="lg"
					className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
				>
					<div className="flex aspect-square size-8 items-center justify-center">
						{email ? (
							<UserAvatar email={email} size={32} />
						) : (
							<div className="size-8 rounded-lg bg-sidebar-primary animate-pulse" />
						)}
					</div>
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-medium">{userDisplayName}</span>
						<span className="truncate text-xs text-muted-foreground">{userEmail}</span>
					</div>
					<ChevronsUpDown className="ml-auto size-4" />
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
				side="bottom"
				align="start"
				sideOffset={4}
			>
				<DropdownMenuLabel className="p-0 font-normal">
					<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<div className="flex aspect-square size-8 items-center justify-center">
							{email ? (
								<UserAvatar email={email} size={32} />
							) : (
								<div className="size-8 rounded-lg bg-sidebar-primary animate-pulse" />
							)}
						</div>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{userDisplayName}</span>
							<span className="truncate text-xs text-muted-foreground">{userEmail}</span>
						</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					{searchSpaceId && (
						<>
							<DropdownMenuItem onClick={() => router.push(`/dashboard/${searchSpaceId}/settings`)}>
								<Settings2 className="mr-2 h-4 w-4" />
								Settings
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => router.push(`/dashboard/${searchSpaceId}/team`)}>
								<UserPlus className="mr-2 h-4 w-4" />
								Invite members
							</DropdownMenuItem>
						</>
					)}
					<DropdownMenuItem onClick={() => router.push("/dashboard")}>
						<SquareLibrary className="mr-2 h-4 w-4" />
						Switch workspace
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					{isClient && (
						<DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
							{theme === "dark" ? (
								<SunIcon className="mr-2 h-4 w-4" />
							) : (
								<MoonIcon className="mr-2 h-4 w-4" />
							)}
							{theme === "dark" ? "Light mode" : "Dark mode"}
						</DropdownMenuItem>
					)}
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleLogout}>
					<LogOut className="mr-2 h-4 w-4" />
					Logout
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
