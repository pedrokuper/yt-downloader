import { useState } from "react";
import Options from "./components/Options";
import { BITRATES, FORMATS } from "./utils/constants";
import Table from "./components/Table";
function App() {
	const [url, setUrl] = useState("");
	const [options, setOptions] = useState({
		format: "mp4",
		quality: "lowest",
		bitrate: 128,
		url: "https://www.youtube.com/watch?v=iAP9AF6DCu4",
	});
	const conversion = () => window.electron.conversion(options);

	return (
		<>
			<section className="p-4">
				<h1 className="text-3xl font-bold  text-center mb-4">
					Youtube Downloader!
				</h1>
				<hr className="m-2" />
				<div className="flex flex-col gap-4 items-center ">
					<input
						onChange={(e) => setUrl(e.target.value)}
						className="border border-zinc-400 w-1/2 p-2 rounded-xl shadow-lg"
						type="text"
						name="url"
						id="url"
						placeholder="Paste your Youtube URL!"
					/>
					<label htmlFor="">
						Formato
						<Options options={FORMATS} />
					</label>
					<label htmlFor="">
						Bitrate
						<Options options={BITRATES} />
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
						disabled
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
