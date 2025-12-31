export const CitationIllustration = () => (
	<div className="relative flex w-full h-full min-h-[6rem] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 p-4">
		<svg viewBox="0 0 400 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
			<title>Citation feature illustration showing clickable source reference</title>
			{/* Background chat message */}
			<g>
				{/* Chat bubble */}
				<rect
					x="20"
					y="30"
					width="200"
					height="60"
					rx="12"
					className="fill-white dark:fill-neutral-800"
					opacity="0.9"
				/>
				{/* Text lines */}
				<line
					x1="35"
					y1="50"
					x2="150"
					y2="50"
					className="stroke-neutral-400 dark:stroke-neutral-600"
					strokeWidth="3"
					strokeLinecap="round"
				/>
				<line
					x1="35"
					y1="65"
					x2="180"
					y2="65"
					className="stroke-neutral-400 dark:stroke-neutral-600"
					strokeWidth="3"
					strokeLinecap="round"
				/>

				{/* Citation badge with glow */}
				<defs>
					<filter id="glow">
						<feGaussianBlur stdDeviation="2" result="coloredBlur" />
						<feMerge>
							<feMergeNode in="coloredBlur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>

				{/* Clickable citation */}
				<g className="cursor-pointer" filter="url(#glow)">
					<rect
						x="185"
						y="57"
						width="28"
						height="20"
						rx="6"
						className="fill-blue-500 dark:fill-blue-600"
					/>
					<text
						x="199"
						y="70"
						fontSize="12"
						fontWeight="bold"
						className="fill-white"
						textAnchor="middle"
					>
						[1]
					</text>
				</g>
			</g>

			{/* Connecting line with animation effect */}
			<g>
				<path
					d="M 199 77 Q 240 90, 260 110"
					className="stroke-blue-500 dark:stroke-blue-400"
					strokeWidth="2"
					strokeDasharray="4,4"
					fill="none"
					opacity="0.6"
				>
					<animate
						attributeName="stroke-dashoffset"
						from="8"
						to="0"
						dur="1s"
						repeatCount="indefinite"
					/>
				</path>

				{/* Arrow head */}
				<polygon
					points="258,113 262,110 260,106"
					className="fill-blue-500 dark:fill-blue-400"
					opacity="0.6"
				/>
			</g>

			{/* Citation popup card */}
			<g>
				{/* Card shadow */}
				<rect
					x="245"
					y="113"
					width="145"
					height="75"
					rx="10"
					className="fill-black"
					opacity="0.1"
					transform="translate(2, 2)"
				/>

				{/* Main card */}
				<rect
					x="245"
					y="113"
					width="145"
					height="75"
					rx="10"
					className="fill-white dark:fill-neutral-800 stroke-blue-500 dark:stroke-blue-400"
					strokeWidth="2"
				/>

				{/* Card header */}
				<rect
					x="245"
					y="113"
					width="145"
					height="25"
					rx="10"
					className="fill-blue-100 dark:fill-blue-900/50"
				/>
				<line
					x1="245"
					y1="138"
					x2="390"
					y2="138"
					className="stroke-blue-200 dark:stroke-blue-800"
					strokeWidth="1"
				/>

				{/* Header text */}
				<text
					x="317.5"
					y="128"
					fontSize="9"
					fontWeight="600"
					className="fill-blue-700 dark:fill-blue-300"
					textAnchor="middle"
				>
					Referenced Chunk
				</text>

				{/* Content lines */}
				<line
					x1="255"
					y1="150"
					x2="365"
					y2="150"
					className="stroke-neutral-600 dark:stroke-neutral-400"
					strokeWidth="2.5"
					strokeLinecap="round"
				/>
				<line
					x1="255"
					y1="162"
					x2="340"
					y2="162"
					className="stroke-neutral-500 dark:stroke-neutral-500"
					strokeWidth="2.5"
					strokeLinecap="round"
				/>
				<line
					x1="255"
					y1="174"
					x2="380"
					y2="174"
					className="stroke-neutral-400 dark:stroke-neutral-600"
					strokeWidth="2.5"
					strokeLinecap="round"
				/>
			</g>

			{/* Sparkle effects */}
			<g className="opacity-60">
				{/* Sparkle 1 */}
				<circle cx="195" cy="45" r="2" className="fill-yellow-400">
					<animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
				</circle>
				<circle cx="195" cy="45" r="1" className="fill-white">
					<animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
				</circle>

				{/* Sparkle 2 */}
				<circle cx="370" cy="125" r="2" className="fill-purple-400">
					<animate
						attributeName="opacity"
						values="0;1;0"
						dur="2.5s"
						begin="0.5s"
						repeatCount="indefinite"
					/>
				</circle>
				<circle cx="370" cy="125" r="1" className="fill-white">
					<animate
						attributeName="opacity"
						values="0;1;0"
						dur="2.5s"
						begin="0.5s"
						repeatCount="indefinite"
					/>
				</circle>

				{/* Sparkle 3 */}
				<circle cx="250" cy="95" r="1.5" className="fill-blue-400">
					<animate
						attributeName="opacity"
						values="0;1;0"
						dur="3s"
						begin="1s"
						repeatCount="indefinite"
					/>
				</circle>
			</g>

			{/* AI Sparkle icon in corner */}
			<g transform="translate(25, 100)">
				<path
					d="M 0,0 L 3,-8 L 6,0 L 14,3 L 6,6 L 3,14 L 0,6 L -8,3 Z"
					className="fill-purple-500 dark:fill-purple-400"
					opacity="0.7"
				>
					<animateTransform
						attributeName="transform"
						type="rotate"
						from="0 3 3"
						to="360 3 3"
						dur="8s"
						repeatCount="indefinite"
					/>
				</path>
			</g>
		</svg>
	</div>
);

