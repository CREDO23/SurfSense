export const CollaborationIllustration = () => (
	<div className="relative flex w-full h-full min-h-44 flex-1 flex-col items-center justify-center overflow-hidden pointer-events-none select-none">
		<div
			role="img"
			aria-label="Illustration of a realtime collaboration in a text editor."
			className="pointer-events-none absolute inset-0 flex flex-col items-start justify-center pl-4 select-none"
		>
			<div className="relative flex h-fit w-fit flex-col items-start">
				<div className="w-full text-2xl sm:text-3xl lg:text-4xl leading-tight text-neutral-700 dark:text-neutral-300">
					<span className="flex items-stretch flex-wrap">
						{/* <span>Real-time </span> */}
						<span className="relative bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-1">
							Real-time
						</span>
						<span className="relative z-10 inline-flex items-stretch justify-start">
							<span className="absolute h-full w-0.5 rounded-b-sm bg-blue-500"></span>
							<span className="absolute inline-flex h-6 sm:h-7 -translate-y-full items-center rounded-t-sm rounded-r-sm px-2 py-0.5 text-xs sm:text-sm font-medium text-white bg-blue-500">
								Sarah
							</span>
						</span>
						<span>collabo</span>
						<span>orat</span>
						<span className="relative z-10 inline-flex items-stretch justify-start">
							<span className="absolute h-full w-0.5 rounded-b-sm bg-purple-600 dark:bg-purple-500"></span>
							<span className="absolute inline-flex h-6 sm:h-7 -translate-y-full items-center rounded-t-sm rounded-r-sm px-2 py-0.5 text-xs sm:text-sm font-medium text-white bg-purple-600 dark:bg-purple-500">
								Josh
							</span>
						</span>
						<span>ion</span>
					</span>
				</div>
			</div>
			{/* Bottom gradient fade */}
			<div className="absolute -right-4 bottom-0 -left-4 h-24 bg-gradient-to-t from-white dark:from-black to-transparent"></div>
			{/* Right gradient fade */}
			<div className="absolute top-0 -right-4 bottom-0 w-20 bg-gradient-to-l from-white dark:from-black to-transparent"></div>
		</div>
	</div>
);

