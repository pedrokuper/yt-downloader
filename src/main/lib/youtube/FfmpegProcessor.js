import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
ffmpeg.setFfmpegPath(ffmpegPath);

export class FfmpegProcessor {
	static process(inputPaths, outputOptions, outputPath, progressCallback) {
		return new Promise((resolve, reject) => {
			let command = ffmpeg(inputPaths[0]);
			if (inputPaths[1]) {
				command = command.input(inputPaths[1]);
			}
			command
				.outputOptions(outputOptions)
				.on("progress", (progress) => {
					// Se envía el objeto completo de progreso
					if (progressCallback) progressCallback(progress);
				})
				.on("end", () => resolve(outputPath))
				.on("error", (err) => reject(err))
				.save(outputPath);
		});
	}
}
