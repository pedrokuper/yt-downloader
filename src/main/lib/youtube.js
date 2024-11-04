import fs from "fs";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path, { parse } from "path";

export async function conversion(
	{ url = "", quality = "", format = "", path = "" } = {},
	win
) {
	if (!url) {
		throw new Error("URL is required");
	}

	let data;

	if (format === "mp3") {
		data = await convertToMp3(url, quality, path, win);
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

// async function convertToMp3(url, quality = 128, dlLoc, onProgress) {
// 	try {
// 		ffmpeg.setFfmpegPath(ffmpegPath);
// 		const fileName = await getFileName(".mp3", url);
// 		const mp3FilePath = path.join(dlLoc, fileName);

// 		// Get video info to calculate total size
// 		const videoInfo = await ytdl.getInfo(url);
// 		const audioFormat = ytdl.chooseFormat(videoInfo.formats, {
// 			quality: "highestaudio",
// 		});
// 		const totalSize = audioFormat.contentLength;

// 		return new Promise((resolve, reject) => {
// 			let downloadedSize = 0;
// 			let conversionProgress = 0;

// 			const videoStream = ytdl(url, {
// 				quality: "highestaudio",
// 			});

// 			const fileWriteStream = fs.createWriteStream(mp3FilePath);

// 			// Track download progress
// 			videoStream.on("progress", (_, downloaded, total) => {
// 				downloadedSize = downloaded;
// 				const downloadProgress = (downloaded / total) * 100;

// 				// Call progress callback with both progress types
// 				if (onProgress) {
// 					onProgress({
// 						type: "download",
// 						progress: downloadProgress.toFixed(2),
// 						downloaded: formatBytes(downloaded),
// 						total: formatBytes(total),
// 					});
// 				}
// 			});

// 			videoStream.on("error", (error) => {
// 				console.error("Error in video stream:", error);
// 				reject(new Error("Failed to download video"));
// 			});

// 			const ffmpegCommand = ffmpeg(videoStream)
// 				.audioBitrate(quality)
// 				.toFormat("mp3")
// 				// Track conversion progress
// 				.on("progress", (progress) => {
// 					conversionProgress = progress.percent || 0;

// 					if (onProgress) {
// 						onProgress({
// 							type: "conversion",
// 							progress: conversionProgress.toFixed(2),
// 							timemark: progress.timemark,
// 						});
// 					}
// 				})
// 				.on("error", (err) => {
// 					console.error("Error during conversion:", err);
// 					reject(new Error("Failed to convert to MP3"));
// 				})
// 				.on("end", async () => {
// 					const file = dlLoc + "/" + fileName;
// 					const fileSize = await getFileSize(file);
// 					const fileSizeText = setFileSizeText(fileSize);
// 					console.log("Conversion complete");
// 					resolve({
// 						name: fileName,
// 						url: url,
// 						size: fileSizeText,
// 						location: dlLoc,
// 					});
// 				});

// 			ffmpegCommand.pipe(fileWriteStream);

// 			fileWriteStream.on("error", (error) => {
// 				console.error("Error writing file:", error);
// 				reject(new Error("Failed to save MP3"));
// 			});
// 		});
// 	} catch (error) {
// 		console.error("Error getting video info:", error);
// 		throw new Error("Failed to get video information");
// 	}
// }

async function convertToMp3(url, quality = 128, dlLoc, win) {
	try {
		console.log("Starting conversion process...");
		ffmpeg.setFfmpegPath(ffmpegPath);
		const fileName = await getFileName(".mp3", url);
		const mp3FilePath = path.join(dlLoc, fileName);

		console.log(`File will be saved as: ${fileName}`);

		return new Promise((resolve, reject) => {
			console.log("Beginning download...");

			const videoStream = ytdl(url, {
				quality: "highestaudio",
			});

			let lastLogged = 0; // To prevent too frequent logging

			const fileWriteStream = fs.createWriteStream(mp3FilePath);

			// // Log the start of download
			// console.log("Download started");

			// // Track download progress
			// videoStream.on("data", (chunk) => {
			// 	// Log every chunk received
			// 	console.log(`Downloading: Received chunk of ${chunk.length} bytes`);
			// });

			// videoStream.on("info", (info, format) => {
			// 	console.log(`Video length: ${info.videoDetails.lengthSeconds} seconds`);
			// 	console.log(`Quality: ${format.quality}`);
			// });

			videoStream.on("progress", (chunkLength, downloaded, total) => {
				console.log("🚀 ~ videoStream.on ~ win:", win);

				const now = Date.now();
				// Only log every 1000ms to avoid console spam
				if (now - lastLogged > 1000) {
					const downloadProgress = ((downloaded / total) * 100).toFixed(2);
					console.log(`Downloaded: ${downloadProgress}%`);
					lastLogged = now;
					win.webContents.send("download-progress", {
						type: "download",
						progress: parseFloat(downloadProgress),
					});
				}
			});

			videoStream.on("error", (error) => {
				console.error("Error in video stream:", error);
				reject(new Error("Failed to download video"));
			});

			const ffmpegCommand = ffmpeg(videoStream)
				.audioBitrate(quality)
				.toFormat("mp3")
				.on("start", () => {
					console.log("FFmpeg conversion started");
				})
				.on("progress", (progress) => {
					if (progress.percent) {
						console.log(`Converting: ${progress.percent.toFixed(1)}%`);
					}
					if (progress.timemark) {
						console.log(`Time: ${progress.timemark}`);
					}
				})
				.on("error", (err) => {
					console.error("Error during conversion:", err);
					reject(new Error("Failed to convert to MP3"));
				})
				.on("end", async () => {
					console.log("FFmpeg processing finished");
					const file = dlLoc + "/" + fileName;
					const fileSize = await getFileSize(file);
					const fileSizeText = setFileSizeText(fileSize);

					console.log("\n=== Conversion Complete ===");
					console.log(`File: ${fileName}`);
					console.log(`Size: ${fileSizeText}`);
					console.log(`Location: ${dlLoc}`);

					resolve({
						name: fileName,
						url: url,
						size: fileSizeText,
						location: dlLoc,
					});
				});

			ffmpegCommand.pipe(fileWriteStream);

			fileWriteStream.on("error", (error) => {
				console.error("Error writing file:", error);
				reject(new Error("Failed to save MP3"));
			});

			// Add more logging for the write stream
			fileWriteStream.on("pipe", () => {
				console.log("Pipe stream connected");
			});

			fileWriteStream.on("finish", () => {
				console.log("Write stream finished");
			});
		});
	} catch (error) {
		console.error("Error in conversion process:", error);
		throw error;
	}
}

async function getFileSize(file) {
	try {
		const stats = await fs.promises.stat(file);
		const size = stats.size / 1000;
		return size;
	} catch (err) {
		console.log(`File doesn't exist.`);
		return 0;
	}
}

function setFileSizeText(size) {
	const isMB = size >= 1024;
	const readableSize = isMB ? size / 1000 : size;
	const unit = isMB ? "MB" : "KB";
	return parseFloat(readableSize).toFixed(2) + unit;
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

// Helper function to format bytes into human-readable format
function formatBytes(bytes, decimals = 2) {
	if (!bytes) return "0 Bytes";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
