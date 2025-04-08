export default function VideoPreview({ videoUrl }) {
	if (!videoUrl) return null;

	const match = videoUrl.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
	const videoId = match?.[1];
	if (!videoId) return null;

	const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

	return (
		<img
			width={250}
			height={250}
			src={thumbnailUrl}
			alt="YouTube video thumbnail"
		/>
	);
}
