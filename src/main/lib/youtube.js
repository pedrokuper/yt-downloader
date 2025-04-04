import fs from "fs";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
ffmpeg.setFfmpegPath(ffmpegPath);
import path from "path";
import { promisify } from "util";

const pipeline = promisify(require("stream").pipeline);

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
	} else {
		data = await convertToMp4(url, quality, path);
	}
	return data;
}

async function getFileName(url) {
	const info = await ytdl.getBasicInfo(url);
	return `${info.videoDetails.title}`.replace(/[/\\?%*:|"<>]/g, "-");
}

async function convertToMp3(url, quality = 128, dlLoc, win) {
	try {
		console.log("Starting conversion process...");
		ffmpeg.setFfmpegPath(ffmpegPath);
		// Obtén el nombre base (sin extensión prohibida)
		const baseName = await getFileName(".mp3", url);
		const extension = ".mp3";
		// Construye la ruta inicial (archivo sin contador)
		let finalName = `${baseName}${extension}`;
		let finalPath = path.join(dlLoc, finalName);
		// Si ese nombre ya existe, agrega contador: (1), (2), etc.
		let count = 1;
		while (fs.existsSync(finalPath)) {
			finalName = `${baseName}(${count})${extension}`;
			finalPath = path.join(dlLoc, finalName);
			count++;
		}

		console.log("Archivo resultante:", finalPath);

		return new Promise((resolve, reject) => {
			console.log("Beginning download...");

			const videoStream = ytdl(url, {
				quality: "highestaudio",
			});

			let lastLogged = 0; // To prevent too frequent logging

			const fileWriteStream = fs.createWriteStream(finalPath);

			// // Log the start of download
			console.log("Download started");

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
					const file = dlLoc + "/" + finalName;
					const fileSize = await getFileSize(file);
					const fileSizeText = setFileSizeText(fileSize);

					console.log("\n=== Conversion Complete ===");
					console.log(`File: ${finalName}`);
					console.log(`Size: ${fileSizeText}`);
					console.log(`Location: ${dlLoc}`);

					resolve({
						name: finalName,
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

// async function convertToMp4(url, quality = "lowest", dlLoc) {
// 	try {
// 		// const info = await ytdl.getBasicInfo(url);
// 		const info = await ytdl.getInfo(url);
// 		const fileName = await getFileName(".mp4", url);
// 		return new Promise((resolve, reject) => {
// 			const mp4FilePath = path.join(dlLoc, fileName);
// 			const writeStream = fs.createWriteStream(mp4FilePath);
// 			// Quality to itag mapping
// 			const qualityMap = {
// 				tiny: "160", // 144p
// 				small: "133", // 240p
// 				medium: "134", // 360p
// 				large: "137", // 1080p
// 			};

// 			const format =
// 				info.formats.find((format) => {
// 					return format.itag === qualityMap[quality] && format.hasVideo;
// 				}) || info.formats.find((format) => format.hasVideo); // Fallback to any video format

// 			// Get the audio format (we'll need both video and audio)
// 			const audioFormat = info.formats.find(
// 				(format) => format.hasAudio && !format.hasVideo
// 			);

// 			if (!format || !audioFormat) {
// 				reject(new Error("No suitable format found"));
// 				return;
// 			}

// 			// Create streams for both video and audio
// 			const videoStream = ytdl(url, {
// 				format: format,
// 			});

// 			const audioStream = ytdl(url, {
// 				format: audioFormat,
// 			});
// 			ffmpeg()
// 				.input(videoStream)
// 				.input(audioStream)
// 				.outputOptions(["-c:v copy", "-c:a aac"])
// 				.toFormat("mp4")
// 				.on("end", () => {
// 					console.log("Video downloaded successfully as:", fileName);
// 					resolve(fileName);
// 				})
// 				.on("error", (error) => {
// 					console.error("Error processing video:", error);
// 					reject(new Error("Failed to process video"));
// 				})
// 				.save(mp4FilePath);

// 			// Set up the download stream
// 			// const downloadStream = ytdl(url, {
// 			// 	// quality: "highestvideo",
// 			// 	// filter: "videoandaudio",
// 			// 	format: {
// 			// 		url: url,
// 			// 		itag: 139,
// 			// 	},
// 			// });

// 			// Use ffmpeg to combine video and audio

// 			// // Pipe the download stream to the file write stream
// 			// downloadStream.pipe(writeStream);

// 			// // Handle errors during the download
// 			// downloadStream.on("error", (error) => {
// 			// 	console.error("Error downloading video:", error);
// 			// 	reject(new Error("Failed to download video"));
// 			// });

// 			// // When the download is finished, send a response
// 			// writeStream.on("finish", () => {
// 			// 	console.log("Video downloaded successfully as:", fileName);
// 			// 	resolve(fileName);
// 			// });

// 			// // Handle write stream errors
// 			// writeStream.on("error", (error) => {
// 			// 	console.error("Error writing file:", error);
// 			// 	reject(new Error("Failed to save video"));
// 			// });
// 		});
// 	} catch (error) {
// 		console.error("Error getting video info:", error);
// 		throw new Error("Failed to get video information");
// 	}
// }

// Helper function to format bytes into human-readable format

// async function convertToMp4(url, quality = "medium", dlLoc) {
// 	try {
// 		const info = await ytdl.getInfo(url);
// 		const fileName = await getFileName(".mp4", url);
// 		const tempVideoPath = path.join(dlLoc, `temp_video_${Date.now()}.mp4`);
// 		const tempAudioPath = path.join(dlLoc, `temp_audio_${Date.now()}.mp4`);
// 		const outputPath = path.join(dlLoc, fileName);

// 		// Quality to itag mapping
// 		const qualityMap = {
// 			tiny: "160", // 144p
// 			small: "133", // 240p
// 			medium: "134", // 360p
// 			large: "137", // 1080p
// 		};

// 		// Get the format based on quality
// 		const videoFormat =
// 			info.formats.find((format) => {
// 				return format.itag === qualityMap[quality] && format.hasVideo;
// 			}) || info.formats.find((format) => format.hasVideo); // Fallback to any video format

// 		// Get the audio format
// 		const audioFormat = info.formats.find(
// 			(format) => format.hasAudio && !format.hasVideo
// 		);

// 		if (!videoFormat || !audioFormat) {
// 			throw new Error("No suitable format found");
// 		}

// 		// Download video and audio separately
// 		await Promise.all([
// 			// Download video
// 			pipeline(
// 				ytdl(url, { format: videoFormat }),
// 				fs.createWriteStream(tempVideoPath)
// 			),
// 			// Download audio
// 			pipeline(
// 				ytdl(url, { format: audioFormat }),
// 				fs.createWriteStream(tempAudioPath)
// 			),
// 		]);

// 		// Combine video and audio using ffmpeg
// 		return new Promise((resolve, reject) => {
// 			ffmpeg(tempVideoPath)
// 				.input(tempAudioPath)
// 				.outputOptions(["-c:v copy", "-c:a aac"])
// 				.save(outputPath)
// 				.on("end", () => {
// 					// Clean up temporary files
// 					fs.unlink(tempVideoPath, () => {});
// 					fs.unlink(tempAudioPath, () => {});
// 					console.log("Video downloaded successfully as:", fileName);
// 					resolve(fileName);
// 				})
// 				.on("error", (error) => {
// 					// Clean up temporary files even on error
// 					fs.unlink(tempVideoPath, () => {});
// 					fs.unlink(tempAudioPath, () => {});
// 					console.error("Error processing video:", error);
// 					reject(new Error("Failed to process video"));
// 				});
// 		});
// 	} catch (error) {
// 		console.error("Error in convertToMp4:", error);
// 		throw error;
// 	}
// }

async function convertToMp4(url, quality = "medium", dlLoc) {
	try {
		const info = await ytdl.getInfo(url);
		const fileName = await getFileName(".mp4", url);
		const tempVideoPath = path.join(dlLoc, `temp_video_${Date.now()}.mp4`);
		const tempAudioPath = path.join(dlLoc, `temp_audio_${Date.now()}.mp4`);
		const outputPath = path.join(dlLoc, fileName);

		// Define quality mappings with their corresponding itags and resolutions
		const qualityMap = {
			tiny: { itag: 160, res: "144p" }, // 144p
			small: { itag: 133, res: "240p" }, // 240p
			medium: { itag: 134, res: "360p" }, // 360p
			large: { itag: 137, res: "1080p" }, // 1080p
		};

		// Get available formats
		const videoFormats = info.formats.filter(
			(format) => format.hasVideo && !format.hasAudio
		);

		// Function to get the best matching format for desired quality
		const getBestMatchingFormat = (formats, targetRes) => {
			// Sort formats by resolution (height)
			const sortedFormats = formats
				.filter((format) => format.height) // Only consider formats with height info
				.sort((a, b) => a.height - b.height);

			const targetHeight = parseInt(targetRes);

			// Find the format with closest resolution
			let bestFormat = sortedFormats[0];
			let minDiff = Math.abs(sortedFormats[0].height - targetHeight);

			for (const format of sortedFormats) {
				const diff = Math.abs(format.height - targetHeight);
				if (diff < minDiff) {
					minDiff = diff;
					bestFormat = format;
				}
			}

			return bestFormat;
		};

		// Get target resolution from quality setting
		const targetRes = qualityMap[quality].res;
		const targetHeight = parseInt(targetRes);

		// Get the best matching video format
		const videoFormat = getBestMatchingFormat(videoFormats, targetHeight);

		// Get the best audio format
		const audioFormat = info.formats
			.filter((format) => format.hasAudio && !format.hasVideo)
			.sort((a, b) => b.audioBitrate - a.audioBitrate)[0];

		if (!videoFormat || !audioFormat) {
			throw new Error("No suitable format found");
		}

		console.log("Selected formats:");
		console.log("Video:", {
			quality: videoFormat.qualityLabel,
			resolution: `${videoFormat.width}x${videoFormat.height}`,
			bitrate: videoFormat.bitrate,
			codec: videoFormat.codecs,
		});
		console.log("Audio:", {
			bitrate: `${audioFormat.audioBitrate}kbps`,
			codec: audioFormat.codecs,
		});

		// Download video and audio separately
		await Promise.all([
			// Download video
			pipeline(
				ytdl(url, { format: videoFormat }),
				fs.createWriteStream(tempVideoPath)
			).then(() => console.log("Video download complete")),
			// Download audio
			pipeline(
				ytdl(url, { format: audioFormat }),
				fs.createWriteStream(tempAudioPath)
			).then(() => console.log("Audio download complete")),
		]);

		console.log("Starting ffmpeg processing...");

		// Combine video and audio using ffmpeg
		return new Promise((resolve, reject) => {
			ffmpeg(tempVideoPath)
				.input(tempAudioPath)
				.outputOptions(["-c:v copy", "-c:a aac"])
				.on("progress", (progress) => {
					if (progress.percent) {
						console.log(`Processing: ${Math.round(progress.percent)}% done`);
					}
				})
				.save(outputPath)
				.on("end", () => {
					// Clean up temporary files
					fs.unlink(tempVideoPath, (err) => {
						if (err) console.error("Error removing temp video file:", err);
					});
					fs.unlink(tempAudioPath, (err) => {
						if (err) console.error("Error removing temp audio file:", err);
					});
					console.log("Video downloaded successfully as:", fileName);
					resolve(fileName);
				})
				.on("error", (error) => {
					// Clean up temporary files even on error
					fs.unlink(tempVideoPath, () => {});
					fs.unlink(tempAudioPath, () => {});
					console.error("Error processing video:", error);
					reject(new Error("Failed to process video"));
				});
		});
	} catch (error) {
		console.error("Error in convertToMp4:", error);
		throw error;
	}
}

function formatBytes(bytes, decimals = 2) {
	if (!bytes) return "0 Bytes";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
