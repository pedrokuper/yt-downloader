export function isYouTubeUrl(url) {
	try {
		const parsedUrl = new URL(url);

		const isShort = parsedUrl.hostname === "youtu.be";
		const isLong =
			parsedUrl.hostname === "www.youtube.com" ||
			parsedUrl.hostname === "youtube.com";

		if (isShort) {
			// e.g. https://youtu.be/ofViy1tJX8k
			const id = parsedUrl.pathname.slice(1);
			return /^[a-zA-Z0-9_-]{11}$/.test(id);
		}

		if (isLong && parsedUrl.pathname === "/watch") {
			// e.g. https://www.youtube.com/watch?v=fP-371MN0Ck&t=2995s
			const id = parsedUrl.searchParams.get("v");
			return /^[a-zA-Z0-9_-]{11}$/.test(id);
		}

		return false;
	} catch (err) {
		return false;
	}
}
