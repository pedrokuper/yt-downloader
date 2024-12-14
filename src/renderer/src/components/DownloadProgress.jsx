import { useState, useEffect } from "react";

export default function DownloadProgress() {
	const [progress, setProgress] = useState({
		download: 0,
		conversion: 0,
	});

	useEffect(() => {
		const unsubscribe = window.electron.onDownloadProgress((progressData) => {
			setProgress((prev) => {
				const updatedProgress = {
					...prev,
					[progressData.type]:
						progressData.progress >= 90 ? 100 : progressData.progress,
				};
				return updatedProgress;
			});
		});

		return () => unsubscribe();
	}, []);

	return (
		<div className="space-y-4">
			<div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
				<div
					className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
					style={{ width: `${progress.download}%` }}
				/>
			</div>
			<div className="text-sm text-gray-600">
				{progress.download > 0 && (
					<div>Download: {progress.download.toFixed(1)}%</div>
				)}
			</div>
		</div>
	);
}
