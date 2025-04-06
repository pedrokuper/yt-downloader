import { useState, useEffect } from "react";
import Options from "./components/Options";
import { BITRATES, VIDEO_QUALITY } from "./utils/constants";
import Table from "./components/Table";
import DownloadProgress from "./components/DownloadProgress";
import Header from "./components/Header";

function App() {
	const [downloadHistory, setDownloadHistory] = useState([]);
	const [isDownloading, setIsDownloading] = useState(false);

	const [options, setOptions] = useState({
		format: "mp3",
		quality: 128,
		url: "https://youtu.be/JxP2y_q51IE",
		path: "",
	});

	useEffect(() => {
		if (!options?.path) handleDefaultDownloadPath();
		handleDownloadHistory();
	}, [options?.path]);

	useEffect(() => {
		const unsubscribe = window.electron.onDownloadUpdate((newDownload) => {
			setDownloadHistory((prev) => [...prev, newDownload]);
			setIsDownloading(false);
		});

		return () => {
			if (unsubscribe) unsubscribe();
		};
	}, []);

	const conversion = async () => {
		if (options.url && options.format) {
			setIsDownloading(true);
			await window.electron.conversion(options);
			handleDownloadHistory();
			setIsDownloading(false);
		}
	};

	async function handleDownloadHistory() {
		const history = await window.electron.getDownloadHistory();
		setDownloadHistory(history);
	}

	async function openDialog() {
		const dialogConfig = {
			title: "Elegir un directorio",
			properties: ["openDirectory"],
		};
		const path = await window.electron.openDialog(
			"showOpenDialog",
			dialogConfig
		);
		if (path) {
			setOptions((prevOpts) => ({ ...prevOpts, path: path }));
		}
	}

	const handleChange = (e) => {
		const { name, value } = e.target;
		setOptions((prevOpts) => ({ ...prevOpts, [name]: value }));
	};

	const toggleFormat = () => {
		setOptions((prevOpts) => ({
			...prevOpts,
			format: prevOpts.format === "mp3" ? "mp4" : "mp3",
			quality: prevOpts.format === "mp3" ? "medium" : "128",
		}));
	};

	const handleShowFile = async () => {
		try {
			const result = await window.electron.openPath(options.path);
			if (!result.success) {
				console.error("Failed to open path:", result.error);
			}
		} catch (error) {
			console.error("Error opening path:", error);
		}
	};

	async function handleDefaultDownloadPath() {
		const defaultPath = await window.electron.defaultDownloadLoc();
		setOptions((prevOpts) => ({ ...prevOpts, path: defaultPath }));
	}

	const LABEL = options?.format === "mp3" ? "Bitrate" : "Calidad de Video";
	const QUALITY_OPTIONS = options?.format === "mp3" ? BITRATES : VIDEO_QUALITY;

	return (
		<div className="min-h-screen bg-gray-50">
			<Header />
			<div className="container mx-auto px-4 py-8">
				<div className="bg-white rounded-lg shadow-lg p-6">
					<div className="flex flex-col gap-6">
						<div className="relative">
							<input
								value={options.url ?? ""}
								onChange={handleChange}
								className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
								type="text"
								name="url"
								id="url"
								placeholder="Pega la URL de YouTube"
							/>
						</div>

						<div className="flex flex-col gap-4">
							{/* Format Toggle Switch */}
							<div className="flex items-center gap-3">
								{/* Left label */}
								<span
									className={`font-medium ${
										options.format === "mp3" ? "text-blue-600" : "text-gray-500"
									}`}
								>
									Audio (MP3)
								</span>

								{/* Toggle */}
								<label className="relative inline-block w-10 h-5 bg-slate-200 rounded-xl">
									{/* The hidden checkbox is what will store the toggle state for accessibility */}
									<input
										type="checkbox"
										className="sr-only"
										checked={options.format === "mp4"}
										onChange={toggleFormat} // calls your existing toggleFormat function
									/>
									{/* The background track */}
									<div
										className={`absolute inset-0rounded-full cursor-pointer transition-colors duration-300 ${options.format === "mp4" ? "bg-blue-600" : "bg-gray-300"}`}
									/>
									{/* The knob */}
									<div
										className={`absolute left-0 top-0 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 
                                        ${options.format === "mp4" ? "translate-x-5" : "translate-x-0"}
                                    `}
									/>
								</label>

								{/* Right label */}
								<span
									className={`font-medium ${
										options.format === "mp4" ? "text-blue-600" : "text-gray-500"
									}`}
								>
									Video (MP4)
								</span>
							</div>

							{/* Quality Selector */}
							<div>
								<label className="block text-gray-700 font-medium mb-2">
									{LABEL}
									<Options
										name="quality"
										options={QUALITY_OPTIONS}
										onChange={handleChange}
										className="w-full mt-1 block p-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
									/>
								</label>
							</div>
						</div>

						<div className="flex flex-col md:flex-row items-start md:items-center gap-3">
							<button
								onClick={openDialog}
								className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md border border-gray-300 shadow-sm transition duration-200"
							>
								Guardar En...
							</button>

							{options.path && (
								<div className="flex-1 overflow-hidden text-ellipsis">
									<a
										href="#"
										className="text-gray-600 hover:text-blue-600 hover:underline truncate block"
										onClick={(e) => {
											e.preventDefault();
											handleShowFile();
										}}
									>
										{options.path}
									</a>
								</div>
							)}
						</div>

						<button
							className={`w-full py-3 px-4 ${
								isDownloading
									? "bg-gray-400 cursor-not-allowed"
									: "bg-blue-600 hover:bg-blue-700"
							} text-white font-medium rounded-md shadow-md transition duration-200`}
							onClick={conversion}
							disabled={isDownloading}
						>
							{isDownloading ? "Descargando..." : "Descargar"}
						</button>

						{isDownloading && <DownloadProgress />}
					</div>
				</div>

				{downloadHistory.length > 0 && (
					<div className="mt-8 bg-white rounded-lg shadow-lg   ">
						<Table
							files={downloadHistory}
							setDownloadHistory={setDownloadHistory}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

export default App;
