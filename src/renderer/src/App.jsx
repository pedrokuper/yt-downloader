import { useState, useEffect } from "react";
import Options from "./components/Options";
import { BITRATES, FORMATS, VIDEO_QUALITY } from "./utils/constants";
import Table from "./components/Table";
function App() {
	console.log("App");
	const [downloadHistory, setDownloadHistory] = useState([]);

	const [options, setOptions] = useState({
		format: "mp3",
		quality: null,
		url: "",
		path: "",
	});

	useEffect(() => {
		if (!options?.path) handleDefaultDownloadPath();
		handleDownloadHistory();
	}, [options?.path]);

	useEffect(() => {
		const unsubscribe = window.electron.onDownloadUpdate((newDownload) => {
			setDownloadHistory((prev) => [...prev, newDownload]);
		});

		return () => {
			if (unsubscribe) unsubscribe();
		};
	}, []);

	const conversion = async () => {
		if (options.url && options.format) {
			await window.electron.conversion(options);
			handleDownloadHistory();
		}
	};

	async function handleDownloadHistory() {
		const history = await window.electron.getDownloadHistory();
		setDownloadHistory(history);
	}

	//TODO - Make into lib/utils
	async function openDialog() {
		const dialogConfig = {
			title: "Elegir un directorio",
			properties: ["openDirectory"],
		};
		const path = await window.electron.openDialog(
			"showOpenDialog",
			dialogConfig
		);
		setOptions((prevOpts) => ({
			...prevOpts,
			path: path,
		}));
	}

	const handleChange = (e) => {
		const { name, value } = e.target;
		setOptions((prevOpts) => ({
			...prevOpts,
			[name]: value,
		}));
	};

	//TODO - Make into lib/utils
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
		setOptions((prevOpts) => ({
			...prevOpts,
			path: defaultPath,
		}));
	}

	const LABEL = options?.format == "mp3" ? "Bitrate" : "Calidad de Video";
	const QUALITY_OPTIONS = options?.format == "mp3" ? BITRATES : VIDEO_QUALITY;

	return (
		<>
			<section className="p-4">
				<h1 className="text-3xl font-bold  text-center mb-4">
					Youtube Downloader!
				</h1>
				<hr className="m-2" />
				<div className="flex flex-col gap-4 items-center ">
					<input
						onChange={handleChange}
						className="border border-zinc-400 w-1/2 p-2 rounded-xl shadow-lg"
						type="text"
						name="url"
						id="url"
						placeholder="Pega la url Youtube"
					/>
					<label htmlFor="">
						Formato
						<Options name="format" onChange={handleChange} options={FORMATS} />
					</label>
					<label htmlFor="quality">
						{LABEL}
						<Options
							name="quality"
							options={QUALITY_OPTIONS}
							onChange={handleChange}
						/>
					</label>
					<div className="flex w-1/2 items-center gap-5">
						<button
							onClick={openDialog}
							className="border w-1/2 rounded-xl shadow-md"
						>
							Elegir Carpeta de Destino
						</button>

						{options.path ? (
							<a
								href={`${options.path}`}
								className="w-1/2 hover:underline cursor-pointer"
								onClick={handleShowFile}
							>
								{options.path}
							</a>
						) : (
							<a
								href={`${options.path}`}
								className="w-1/2 hover:underline"
								onClick={handleShowFile}
							>
								{options.path}
							</a>
						)}
					</div>
					<button
						className="border w-1/2 rounded-xl shadow-md"
						onClick={conversion}
					>
						Descargar
					</button>
				</div>
				<hr className="m-2" />
				<Table files={downloadHistory} />
			</section>
		</>
	);
}

export default App;
