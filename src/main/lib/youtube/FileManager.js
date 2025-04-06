import ytdl from "@distube/ytdl-core";
import fs from "fs";
import path from "path";
/**
 * FileManager se encarga de gestionar nombres de archivos, sanitizarlos y obtener
 * el tamaño de los mismos.
 */
export class FileManager {
	static sanitizeFileName(name) {
		return name.replace(/[\/\\:*?"<>|]/g, "_");
	}

	static async getFileName(url) {
		const info = await ytdl.getBasicInfo(url);
		const title = (info.videoDetails.title || "video").trim();
		return FileManager.sanitizeFileName(title);
	}

	static async getUniqueFilePath(baseDir, baseName, extension) {
		let finalName = `${baseName}${extension}`;
		let finalPath = path.join(baseDir, finalName);
		let count = 1;
		while (fs.existsSync(finalPath)) {
			finalName = `${baseName}(${count})${extension}`;
			finalPath = path.join(baseDir, finalName);
			count++;
		}
		return finalPath;
	}

	static async getFileSize(filePath) {
		try {
			const stats = await fs.promises.stat(filePath);
			return stats.size;
		} catch (err) {
			console.log("El archivo no existe.");
			return 0;
		}
	}

	static setFileSizeText(bytes) {
		const sizeInKB = bytes / 1024;
		const isMB = sizeInKB >= 1024;
		const readableSize = isMB ? sizeInKB / 1024 : sizeInKB;
		const unit = isMB ? "MB" : "KB";
		return `${parseFloat(readableSize).toFixed(2)}${unit}`;
	}
}
