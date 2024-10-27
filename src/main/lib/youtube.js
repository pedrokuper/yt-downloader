import fs from "fs";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";

export async function conversion({
	url = "",
	quality = "",
	format = "",
	path = "",
} = {}) {
	if (!url) {
		throw new Error("URL is required");
	}

	let data;

	if (format === "mp3") {
		data = await convertToMp3(url, quality, path);
		console.log("🚀 ~ data convertToMp3:", data);
	} else {
		data = await convertToMp4(url, quality, path);
		console.log("🚀 ~ data convertToMp4:", data);
	}
	return data;
}

async function getFileName(fileType, url) {
	const info = await ytdl.getBasicInfo(url);
	return `${info.videoDetails.title}${fileType}`.replace(/[/\\?%*:|"<>]/g, "-");
}

async function convertToMp3(url, quality = 128, dlLoc) {
	try {
		ffmpeg.setFfmpegPath(ffmpegPath);

		const fileName = await getFileName(".mp3", url);

		const mp3FilePath = path.join(dlLoc, fileName);

		return new Promise((resolve, reject) => {
			const videoStream = ytdl(url, {
				quality: "highestaudio",
			});

			// Create a write stream for saving the MP3 to disk
			const fileWriteStream = fs.createWriteStream(mp3FilePath);

			// Handle potential errors in the video stream
			videoStream.on("error", (error) => {
				console.error("Error in video stream:", error);
				reject(new Error("Failed to download video"));
			});

			const ffmpegCommand = ffmpeg(videoStream)
				.audioBitrate(quality)
				.toFormat("mp3")
				.on("error", (err) => {
					console.error("Error during conversion:", err);
					reject(new Error("Failed to convert to MP3"));
				})
				.on("end", () => {
					console.log("MP3 conversion complete:", fileName);
					resolve({
						name: fileName,
						url: url,
						size: "1.2 MB",
						location: dlLoc,
					});
				});

			// Pipe the converted audio to the file
			ffmpegCommand.pipe(fileWriteStream);

			// Handle write stream errors
			fileWriteStream.on("error", (error) => {
				console.error("Error writing file:", error);
				reject(new Error("Failed to save MP3"));
			});
		});
	} catch (error) {
		console.error("Error getting video info:", error);
		throw new Error("Failed to get video information");
	}
}

async function convertToMp4(url, quality = "lowest", dlLoc) {
	try {
		const info = await ytdl.getBasicInfo(url);
		const fileName = await getFileName(".mp4", url);

		return new Promise((resolve, reject) => {
			const mp4FilePath = path.join(dlLoc, fileName);
			const writeStream = fs.createWriteStream(mp4FilePath);

			// Set up the download stream
			const downloadStream = ytdl(url, {
				quality: quality,
				filter: "audioandvideo",
			});

			// Pipe the download stream to the file write stream
			downloadStream.pipe(writeStream);

			// Handle errors during the download
			downloadStream.on("error", (error) => {
				console.error("Error downloading video:", error);
				reject(new Error("Failed to download video"));
			});

			// When the download is finished, send a response
			writeStream.on("finish", () => {
				console.log("Video downloaded successfully as:", fileName);
				resolve(fileName);
			});

			// Handle write stream errors
			writeStream.on("error", (error) => {
				console.error("Error writing file:", error);
				reject(new Error("Failed to save video"));
			});
		});
	} catch (error) {
		console.error("Error getting video info:", error);
		throw new Error("Failed to get video information");
	}
}
