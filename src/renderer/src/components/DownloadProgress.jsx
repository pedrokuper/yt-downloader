import { useState, useEffect } from "react";

const DownloadProgress = () => {
	const [progress, setProgress] = useState({
		download: 0,
		conversion: 0,
	});

	useEffect(() => {
		// Subscribe to progress updates
		const unsubscribe = window.electron.onDownloadProgress((progressData) => {
			setProgress((prev) => ({
				...prev,
				[progressData.type]: progressData.progress,
			}));
		});

		// Cleanup subscription
		return () => unsubscribe();
	}, []);

	// Calculate total progress (average of download and conversion)
	const totalProgress = (progress.download + progress.conversion) / 2;

	return (
		<div className="space-y-4">
			<div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
				<div
					className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
					style={{ width: `${totalProgress}%` }}
				/>
			</div>
			<div className="text-sm text-gray-600">
				{progress.download > 0 && (
					<div>Download: {progress.download.toFixed(1)}%</div>
				)}
				{progress.conversion > 0 && (
					<div>Converting: {progress.conversion.toFixed(1)}%</div>
				)}
			</div>
		</div>
	);
};

export default DownloadProgress;
