/* eslint-disable prettier/prettier */
import fs from "fs";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";

export function conversion(opts) {
	if (!opts.url) {
		throw new Error("URL is required");
	}

	if (opts.format === "mp3") {
		convertToMp3(opts.url, opts.bitrate);
	} else {
		convertToMp4(opts.url);
	}
}

async function convertToMp3(videoUrl, bitrate = 128) {
	try {
		ffmpeg.setFfmpegPath(ffmpegPath);

		// Get video info first
		const info = await ytdl.getBasicInfo(videoUrl);
		const fileName = `${info.videoDetails.title}.mp3`.replace(
			/[/\\?%*:|"<>]/g,
			"-"
		); // Remove invalid filename characters

		const mp3FilePath = path.join(__dirname, fileName);

		return new Promise((resolve, reject) => {
			const videoStream = ytdl(videoUrl, { quality: "highestaudio" });

			// Create a write stream for saving the MP3 to disk
			const fileWriteStream = fs.createWriteStream(mp3FilePath);

			// Handle potential errors in the video stream
			videoStream.on("error", (error) => {
				console.error("Error in video stream:", error);
				reject(new Error("Failed to download video"));
			});

			const ffmpegCommand = ffmpeg(videoStream)
				.audioBitrate(bitrate)
				.toFormat("mp3")
				.on("error", (err) => {
					console.error("Error during conversion:", err);
					reject(new Error("Failed to convert to MP3"));
				})
				.on("end", () => {
					console.log("MP3 conversion complete:", fileName);
					resolve(mp3FilePath);
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

async function convertToMp4(videoUrl, quality = "lowest") {
	try {
		// Get video info first
		const info = await ytdl.getBasicInfo(videoUrl);
		const fileName = `${info.videoDetails.title}.mp4`.replace(
			/[/\\?%*:|"<>]/g,
			"-"
		); // Remove invalid filename characters

		return new Promise((resolve, reject) => {
			const writeStream = fs.createWriteStream(fileName);

			// Set up the download stream
			const downloadStream = ytdl(videoUrl, {
				quality: quality,
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
