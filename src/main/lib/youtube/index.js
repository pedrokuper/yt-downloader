import fs from "fs";
import path from "path";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { promisify } from "util";
import { FileManager } from "./FileManager.js";
import { FfmpegProcessor } from "./FfmpegProcessor.js";
import dayjs from "dayjs";
const pipeline = promisify(require("stream").pipeline);
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Downloader abstrae la descarga de un flujo a un archivo usando ytdl.
 */
class Downloader {
	static async download(url, formatOptions, outputPath) {
		return pipeline(
			ytdl(url, formatOptions),
			fs.createWriteStream(outputPath)
		).then(() => outputPath);
	}
}

/**
 * BaseConverter contiene las propiedades comunes a ambos conversores.
 */
class BaseConverter {
	constructor(url, quality, downloadDir) {
		this.url = url;
		this.quality = quality;
		this.downloadDir = downloadDir;
	}
}

/**
 * Mp3Converter se encarga de la conversión a MP3.
 *
 * En este caso se realiza la conversión en streaming, ya que para audio es
 * habitual trabajar directamente con el stream de ytdl.
 */
class Mp3Converter extends BaseConverter {
	async convert(progressCallback, win) {
		console.log("Iniciando conversión a MP3...");
		const baseName = await FileManager.getFileName(this.url);
		const outputPath = await FileManager.getUniqueFilePath(
			this.downloadDir,
			baseName,
			".mp3"
		);

		return new Promise((resolve, reject) => {
			const videoStream = ytdl(this.url, { quality: "highestaudio" });
			const fileWriteStream = fs.createWriteStream(outputPath);

			videoStream.on("progress", (chunkLength, downloaded, total) => {
				const progress = ((downloaded / total) * 100).toFixed(2);
				console.log(`Descargado: ${progress}%`);
				if (win) {
					win.webContents.send("download-progress", {
						type: "download",
						progress: parseFloat(progress),
					});
				}
				if (progressCallback) progressCallback(parseFloat(progress));
			});

			videoStream.on("error", (error) => {
				console.error("Error en el stream de video:", error);
				reject(new Error("Fallo en la descarga del video"));
			});

			const ffmpegCommand = ffmpeg(videoStream)
				.audioBitrate(this.quality)
				.toFormat("mp3")
				.on("start", () => console.log("Conversión FFmpeg iniciada"))
				.on("progress", (progress) => {
					if (progress.percent) {
						console.log(`Convirtiendo: ${progress.percent.toFixed(1)}%`);
					}
				})
				.on("error", (err) => {
					console.error("Error durante la conversión:", err);
					reject(new Error("Fallo al convertir a MP3"));
				})
				.on("end", async () => {
					console.log("Proceso FFmpeg finalizado");
					const fileSize = await FileManager.getFileSize(outputPath);
					const fileSizeText = FileManager.setFileSizeText(fileSize);
					resolve({
						name: path.basename(outputPath),
						url: this.url,
						size: fileSizeText,
						location: this.downloadDir,
						date: dayjs().format("DD-MM-YYYY hh:mm:ss"),
					});
				});

			ffmpegCommand.pipe(fileWriteStream);

			fileWriteStream.on("error", (error) => {
				console.error("Error al escribir el archivo:", error);
				reject(new Error("Fallo al guardar el MP3"));
			});
		});
	}
}

/**
 * Mp4Converter se encarga de la conversión a MP4.
 *
 * Aquí integramos la clase Downloader para evitar repetir el proceso de descarga.
 */
class Mp4Converter extends BaseConverter {
	constructor(url, quality, downloadDir) {
		super(url, quality, downloadDir);
		this.qualityMap = {
			tiny: { res: "144p" },
			small: { res: "240p" },
			medium: { res: "360p" },
			hd: { res: "720p" },
			large: { res: "1080p" },
			veryLarge: { res: "2160p" },
		};
	}

	getBestMatchingFormat(formats, targetRes) {
		const sorted = formats
			.filter((f) => f.height)
			.sort((a, b) => a.height - b.height);
		const targetHeight = parseInt(targetRes);
		let best = sorted[0];
		let minDiff = Math.abs(sorted[0].height - targetHeight);
		for (const format of sorted) {
			const diff = Math.abs(format.height - targetHeight);
			if (diff < minDiff) {
				minDiff = diff;
				best = format;
			}
		}
		return best;
	}

	async convert(progressCallback, win) {
		console.log("Iniciando conversión a MP4...");
		const info = await ytdl.getInfo(this.url);
		// Duración total en segundos
		const totalDuration = parseFloat(info.videoDetails.lengthSeconds);
		const baseName = (await FileManager.getFileName(this.url)) + ".mp4";
		const outputPath = path.join(this.downloadDir, baseName);

		// Rutas temporales
		const tempVideoPath = path.join(
			this.downloadDir,
			`temp_video_${Date.now()}.mp4`
		);
		const tempAudioPath = path.join(
			this.downloadDir,
			`temp_audio_${Date.now()}.mp4`
		);

		// Selección de formatos
		const targetRes = this.qualityMap[this.quality]?.res || "360p";
		const videoFormats = info.formats.filter((f) => f.hasVideo && !f.hasAudio);
		const audioFormats = info.formats.filter((f) => f.hasAudio && !f.hasVideo);
		const videoFormat = this.getBestMatchingFormat(videoFormats, targetRes);
		const audioFormat = audioFormats.sort(
			(a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0)
		)[0];

		if (!videoFormat || !audioFormat) {
			throw new Error(
				"No se encontró un formato adecuado para la calidad solicitada"
			);
		}

		console.log("Formatos seleccionados:");
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

		// Descarga concurrente de video y audio usando Downloader
		await Promise.all([
			Downloader.download(
				this.url,
				{ format: videoFormat },
				tempVideoPath
			).then(() => console.log("Descarga de video completada")),
			Downloader.download(
				this.url,
				{ format: audioFormat },
				tempAudioPath
			).then(() => console.log("Descarga de audio completada")),
		]);

		// Función auxiliar para parsear un timemark (ej: "00:01:23.45") a segundos
		const parseTimeMark = (timemark) => {
			const parts = timemark.split(":").map(parseFloat);
			// Por ejemplo, "00:01:23.45" se transforma a segundos
			return parts[0] * 3600 + parts[1] * 60 + parts[2];
		};

		// Fusión de video y audio con FFmpeg con notificación de progreso
		await FfmpegProcessor.process(
			[tempVideoPath, tempAudioPath],
			["-c:v copy", "-c:a aac"],
			outputPath,
			(progress) => {
				if (progress.timemark) {
					const currentTime = parseTimeMark(progress.timemark);
					const percent = totalDuration
						? (currentTime / totalDuration) * 100
						: 0;
					if (win) {
						win.webContents.send("download-progress", {
							type: "download",
							progress: parseFloat(percent.toFixed(2)),
						});
					}
					if (progressCallback)
						progressCallback(parseFloat(percent.toFixed(2)));
					console.log(`Procesando: ${percent.toFixed(2)}% completado`);
				} else if (progress.percent) {
					// En caso de que ffmpeg devuelva progress.percent
					if (win) {
						win.webContents.send("download-progress", {
							type: "download",
							progress: progress.percent,
						});
					}
					if (progressCallback) progressCallback(progress.percent);
					console.log(`Procesando: ${progress.percent}% completado`);
				}
			}
		);

		fs.unlink(tempVideoPath, (err) => {
			if (err)
				console.error("Error al remover el archivo de video temporal:", err);
		});
		fs.unlink(tempAudioPath, (err) => {
			if (err)
				console.error("Error al remover el archivo de audio temporal:", err);
		});

		console.log("Video generado exitosamente como:", baseName);
		const fileSize = await FileManager.getFileSize(outputPath);
		const fileSizeText = FileManager.setFileSizeText(fileSize);

		return {
			name: baseName,
			url: this.url,
			size: fileSizeText,
			location: this.downloadDir,
			date: dayjs().format("DD-MM-YYYY hh:mm:ss"),
		};
	}
}

/**
 * Función principal que decide qué conversor usar según el formato solicitado.
 */
export async function conversion(
	{ url = "", quality = "", format = "", path: downloadDir = "" } = {},
	win
) {
	if (!url) {
		throw new Error("La URL es obligatoria");
	}
	let data;
	if (format === "mp3") {
		const converter = new Mp3Converter(url, quality, downloadDir);
		data = await converter.convert((progress) => {
			if (win) {
				win.webContents.send("conversion-progress", {
					type: "mp3",
					progress: progress,
				});
			}
		}, win);
	} else {
		const converter = new Mp4Converter(url, quality, downloadDir);
		data = await converter.convert((progress) => {
			if (win) {
				win.webContents.send("conversion-progress", {
					type: "mp4",
					progress: progress,
				});
			}
		}, win);
	}
	return data;
}
