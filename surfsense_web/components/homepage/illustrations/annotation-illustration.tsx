export const AnnotationIllustration = () => (
	<div className="relative flex w-full h-full min-h-44 flex-1 flex-col items-center justify-center overflow-hidden pointer-events-none select-none">
		<div
			role="img"
			aria-label="Illustration of a text editor with annotation comments."
			className="pointer-events-none absolute inset-0 flex flex-col items-start justify-center pl-4 select-none md:left-1/2"
		>
			<div className="relative flex h-fit w-fit flex-col items-start justify-center gap-3.5">
				{/* Text above the comment box */}
				<div className="absolute left-0 h-fit -translate-x-full pr-7 text-3xl sm:text-4xl lg:text-5xl tracking-tight whitespace-nowrap text-neutral-400 dark:text-neutral-600">
					<span className="relative">
						Add context with
						<div className="absolute inset-0 bg-gradient-to-r from-white dark:from-black via-white dark:via-black to-transparent"></div>
					</span>{" "}
					<span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
						comments
					</span>
				</div>

				{/* Comment card */}
				<div className="flex flex-col items-start gap-4 rounded-xl bg-neutral-100 dark:bg-neutral-900/50 px-6 py-5 text-xl sm:text-2xl lg:text-3xl max-w-md">
					<div className="truncate leading-normal text-neutral-600 dark:text-neutral-400">
						<span>Let's discuss this tomorrow!</span>
					</div>

					{/* Reaction icons */}
					<div className="flex items-center gap-3 opacity-30">
						{/* @ icon */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							fill="none"
							viewBox="0 0 24 24"
							className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8"
						>
							<title>Mention icon</title>
							<g
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="1.8"
							>
								<path d="M11.998 15.6a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z" />
								<path d="M15.602 8.4v4.44c0 1.326 1.026 2.52 2.28 2.52a2.544 2.544 0 0 0 2.52-2.52V12a8.4 8.4 0 1 0-3.36 6.72" />
							</g>
						</svg>

						{/* Emoji icon */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							fill="none"
							viewBox="0 0 24 24"
							className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8"
						>
							<title>Emoji icon</title>
							<g
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="1.8"
							>
								<path d="M12.002 20.4a8.4 8.4 0 1 0 0-16.8 8.4 8.4 0 0 0 0 16.8Z" />
								<path d="M9 13.8s.9 1.8 3 1.8 3-1.8 3-1.8M9.6 9.6h.008M14.398 9.6h.009M9.597 9.9a.3.3 0 1 0 0-.6.3.3 0 0 0 0 .6ZM14.402 9.9a.3.3 0 1 0 0-.6.3.3 0 0 0 0 .6Z" />
							</g>
						</svg>

						{/* Attachment icon */}
						<svg
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8"
						>
							<title>Attachment icon</title>
							<path
								d="M16.8926 14.0829L12.425 18.4269C10.565 20.2353 7.47136 20.2353 5.61136 18.4269C3.75976 16.6269 3.75976 13.6029 5.61136 11.8029L12.4886 5.11529C13.7294 3.90809 15.7934 3.90689 17.0354 5.11169C18.2714 6.31169 18.2738 8.33009 17.039 9.53249L10.1462 16.2189C9.83929 16.5093 9.43285 16.6711 9.01036 16.6711C8.58786 16.6711 8.18142 16.5093 7.87456 16.2189C7.72623 16.0757 7.60817 15.9042 7.52737 15.7146C7.44656 15.525 7.40466 15.321 7.40416 15.1149C7.40416 14.7009 7.57216 14.3037 7.87456 14.0109L12.4178 9.59849"
								stroke="currentColor"
								strokeWidth="1.8"
							/>
						</svg>
					</div>
				</div>
			</div>

			{/* Bottom gradient fade */}
			<div className="absolute -right-4 bottom-0 -left-4 h-20 bg-gradient-to-t from-white dark:from-black to-transparent"></div>
			{/* Right gradient fade */}
			<div className="absolute top-0 -right-4 bottom-0 w-20 bg-gradient-to-l from-white dark:from-black to-transparent"></div>
		</div>
	</div>
);

