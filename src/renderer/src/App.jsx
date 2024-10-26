import { useState } from "react";
import Options from "./components/Options";
import { BITRATES, FORMATS } from "./utils/constants";
import Table from "./components/Table";
function App() {
	const [options, setOptions] = useState({
		format: "mp3",
		bitrate: 128,
		url: "",
	});

	const conversion = () => {
		console.log(options);
		if (options.url && options.format) window.electron.conversion(options);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setOptions((prevOpts) => ({
			...prevOpts,
			[name]: value,
		}));
	};

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
					<label htmlFor="bitrate">
						Bitrate
						<Options
							name="bitrate"
							options={BITRATES}
							onChange={handleChange}
						/>
					</label>
					<div className="flex w-1/2 items-center gap-5">
						<h5>Guardar</h5>
						<button className="border w-1/2 rounded-xl shadow-md">
							Elegir
						</button>
						<button className="border w-1/2 rounded-xl shadow-md">
							Abrir Carpeta
						</button>
					</div>
					<button
						className="border w-1/2 rounded-xl shadow-md"
						onClick={conversion}
					>
						Descargar
					</button>
				</div>
				<hr className="m-2" />
				{/* <Table files={files} /> */}
			</section>
		</>
	);
}

export default App;

const files = [
	{ name: "document.pdf", size: "1.2 MB", location: "/documents" },
	{ name: "image.jpg", size: "800 KB", location: "/images" },
	{ name: "document.pdf", size: "1.2 MB", location: "/documents" },
	{ name: "image.jpg", size: "800 KB", location: "/images" },
	{ name: "document.pdf", size: "1.2 MB", location: "/documents" },
	{ name: "image.jpg", size: "800 KB", location: "/images" },
];
