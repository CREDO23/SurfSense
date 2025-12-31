import Image from "next/image";

export const AudioCommentIllustration = () => (
	<div className="relative flex w-full h-full min-h-[6rem] overflow-hidden rounded-xl">
		<Image
			src="/homepage/comments-audio.webp"
			alt="Audio Comment Illustration"
			fill
			className="object-cover"
		/>
	</div>
);
