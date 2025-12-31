/**
 * Avatar utility functions for generating dynamic user avatars
 */

/**
 * Generates a consistent color based on a string (email)
 */
export function stringToColor(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	const colors = [
		"#6366f1", // indigo
		"#8b5cf6", // violet
		"#a855f7", // purple
		"#d946ef", // fuchsia
		"#ec4899", // pink
		"#f43f5e", // rose
		"#ef4444", // red
		"#f97316", // orange
		"#eab308", // yellow
		"#84cc16", // lime
		"#22c55e", // green
		"#14b8a6", // teal
		"#06b6d4", // cyan
		"#0ea5e9", // sky
		"#3b82f6", // blue
	];
	return colors[Math.abs(hash) % colors.length];
}

/**
 * Gets initials from an email address
 */
export function getInitials(email: string): string {
	const name = email.split("@")[0];
	const parts = name.split(/[._-]/);
	if (parts.length >= 2) {
		return (parts[0][0] + parts[1][0]).toUpperCase();
	}
	return name.slice(0, 2).toUpperCase();
}

/**
 * Dynamic avatar component that generates an SVG based on email
 */
export function UserAvatar({ email, size = 32 }: { email: string; size?: number }) {
	const bgColor = stringToColor(email);
	const initials = getInitials(email);

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 32 32"
			className="rounded-lg"
			role="img"
			aria-labelledby="sidebar-avatar-title"
		>
			<title id="sidebar-avatar-title">Avatar for {email}</title>
			<rect width="32" height="32" rx="6" fill={bgColor} />
			<text
				x="50%"
				y="50%"
				dominantBaseline="central"
				textAnchor="middle"
				fill="white"
				fontSize="12"
				fontWeight="600"
				fontFamily="system-ui, sans-serif"
			>
				{initials}
			</text>
		</svg>
	);
}
