import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * FfmpegProcessor encapsula la lógica para procesar archivos con ffmpeg.
 */
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
					if (progress.percent && progressCallback) {
						progressCallback(Math.round(progress.percent));
					}
				})
				.on("end", () => resolve(outputPath))
				.on("error", (err) => reject(err))
				.save(outputPath);
		});
	}
}
