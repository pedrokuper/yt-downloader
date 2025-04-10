import Actions from "./Actions";

export default function Table({ files = [], setDownloadHistory }) {
	if (files.length < 1) return null;

	const handleShowFile = async (location) => {
		try {
			const result = await window.electron.openPath(location);
			if (!result.success) {
				console.error("Failed to open path:", result.error);
			}
		} catch (error) {
			console.error("Error opening path:", error);
		}
	};

	const handleClearHistory = async () => {
		try {
			const result = await window.electron.onClearHistory();
			if (result) setDownloadHistory([]);
		} catch (error) {
			console.error("Error handleClearHistory:", error);
		}
	};

	const handleDelete = async (file, i) => {
		try {
			const deleted = await window.electron.onFileDelete(file, i);
			if (deleted) {
				setDownloadHistory((prevHistory) => {
					return prevHistory.filter((_, index) => index !== i);
				});
			}
		} catch (e) {
			console.error(e);
		}
	};

	return (
		<div className="bg-white p-4 rounded-md shadow-sm">
			{/* Encabezado de la sección */}
			<header className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-semibold">Historial de Descargas</h2>
				<button
					onClick={handleClearHistory}
					className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded transition"
				>
					Limpiar Historial
				</button>
			</header>

			{/* Contenedor para el scroll */}
			<div className="border border-gray-200 rounded overflow-auto max-h-80">
				<table className="min-w-full table-auto text-sm">
					<thead className="bg-gray-100 sticky top-0">
						<tr>
							<th className="px-4 py-2 text-left border-b w-48">Nombre</th>
							<th className="px-4 py-2 text-left border-b w-64">URL</th>
							<th className="px-4 py-2 text-left border-b w-24">Tamaño</th>
							<th className="px-4 py-2 text-left border-b w-44">Fecha</th>
							<th className="px-4 py-2 text-left border-b w-24">Ubicación</th>
							<th className="px-4 py-2 text-left border-b w-24">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{files.map((file, i) => (
							<tr key={i} className="hover:bg-gray-50">
								<td className="px-4 py-2 border-b">
									<div className="truncate w-80" title={file.name}>
										{file.name}
									</div>
								</td>
								<td className="px-4 py-2 border-b">
									<a
										href={file.url}
										target="_blank"
										rel="noopener noreferrer"
										title={file.url}
										className="underline text-blue-600 hover:text-blue-800 truncate"
									>
										{file.url}
									</a>
								</td>
								<td className="px-4 py-2 border-b">{file.size}</td>

								<td className="px-4 py-2 border-b">{file?.date}</td>
								<td className="px-4 py-2 border-b">
									<div
										className="truncate w-64 cursor-pointer hover:text-blue-600"
										title={file.location}
										onClick={() => handleShowFile(file.location)}
									>
										{file.location}
									</div>
								</td>
								<td className="px-4 py-2 border-b">
									<Actions handleDelete={() => handleDelete(file, i)} />
								</td>
							</tr>
						))}

						{files.length === 0 && (
							<tr>
								<td colSpan={4} className="p-4 text-center text-gray-500">
									No hay descargas registradas
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
