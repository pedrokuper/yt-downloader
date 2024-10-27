import { useState } from "react";
import Options from "./components/Options";
import { BITRATES, FORMATS, VIDEO_QUALITY } from "./utils/constants";
import Table from "./components/Table";
function App() {
	const [options, setOptions] = useState({
		format: "mp3",
		quality: null,
		url: "",
		path: "",
	});

	const conversion = () => {
		console.log(options);
		if (options.url && options.format) window.electron.conversion(options);
	};

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

	const handleShowFile = async (e) => {
		e.preventDefault();
		try {
			const result = await window.electron.openPath(options.path);
			if (!result.success) {
				console.error("Failed to open path:", result.error);
			}
		} catch (error) {
			console.error("Error opening path:", error);
		}
	};

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
						placeholder="Paste your Youtube URL!"
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
						<a
							href={`${options.path}`}
							className="w-1/2 hover:underline"
							onClick={handleShowFile}
						>
							{options.path}
						</a>
					</div>
					<button
						className="border w-1/2 rounded-xl shadow-md"
						onClick={conversion}
					>
						Descargar
					</button>
				</div>
				<hr className="m-2" />
				<Table files={files} />
			</section>
		</>
	);
}

export default App;

const files = [
	{
		name: "document.pdf",
		url: "https://youtu.be/i23iF0h9jmk",
		size: "1.2 MB",
		location: "/documents",
	},
	{
		name: "image.jpg",
		url: "https://youtu.be/i23iF0h9jmk",
		size: "800 KB",
		location: "/images",
	},
	{
		name: "document.pdf",
		url: "https://youtu.be/i23iF0h9jmk",
		size: "1.2 MB",
		location: "/documents",
	},
	{
		name: "image.jpg",
		url: "https://youtu.be/i23iF0h9jmk",
		size: "800 KB",
		location: "/images",
	},
	{
		name: "document.pdf",
		url: "https://youtu.be/i23iF0h9jmk",
		size: "1.2 MB",
		location: "/documents",
	},
	{
		name: "image.jpg",
		url: "https://youtu.be/i23iF0h9jmk",
		size: "800 KB",
		location: "/images",
	},
];
