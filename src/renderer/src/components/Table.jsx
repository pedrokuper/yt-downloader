import { useState } from "react";
import Actions from "./Actions";

export default function Table({ files = [], setDownloadHistory }) {
	const [sortConfig, setSortConfig] = useState({
		key: "date",
		direction: "desc",
	});

	if (files.length < 1) return null;

	// Handle sorting logic
	const sortedFiles = [...files].sort((a, b) => {
		if (sortConfig.key === "size") {
			// Convert size to bytes for comparison
			const sizeA = parseFileSize(a.size);
			const sizeB = parseFileSize(b.size);

			return sortConfig.direction === "asc" ? sizeA - sizeB : sizeB - sizeA;
		} else if (sortConfig.key === "date") {
			const dateA = new Date(a.date || 0);
			const dateB = new Date(b.date || 0);

			return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
		} else if (sortConfig.key === "name") {
			return sortConfig.direction === "asc"
				? a.name.localeCompare(b.name)
				: b.name.localeCompare(a.name);
		}

		return 0;
	});

	// Function to parse file size string to bytes (for sorting)
	function parseFileSize(sizeStr) {
		if (!sizeStr) return 0;

		try {
			const sizeMatch = sizeStr.match(/^([\d.]+)\s*([KMGT]?B)$/i);
			if (!sizeMatch) return 0;

			const [, size, unit] = sizeMatch;
			const numSize = parseFloat(size);

			switch (unit.toUpperCase()) {
				case "KB":
					return numSize * 1024;
				case "MB":
					return numSize * 1024 * 1024;
				case "GB":
					return numSize * 1024 * 1024 * 1024;
				case "TB":
					return numSize * 1024 * 1024 * 1024 * 1024;
				default:
					return numSize;
			}
		} catch (e) {
			return 0;
		}
	}

	// Request sort function
	function requestSort(key) {
		let direction = "asc";

		// If we're already sorting by this key, toggle direction
		if (sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}

		setSortConfig({ key, direction });
	}

	// Function to render sort indicator
	function getSortIndicator(key) {
		if (sortConfig.key !== key) return "↕️";
		return sortConfig.direction === "asc" ? "↑" : "↓";
	}

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

	const handlePlay = async (file) => {
		window.electron.onFilePlay(file);
	};

	return (
		<div className="bg-white p-4 rounded-md shadow-sm">
			{/* Encabezado de la sección */}
			<header className="flex items-center justify-between mb-4">
				<div>
					<h2 className="text-lg font-semibold">Historial de Descargas</h2>
					<label htmlFor="search">
						Buscar
						<input
							className="border ml-2 px-2 py-1 rounded"
							type="text"
							name="search"
							id="search"
						/>
					</label>
				</div>
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
							<th
								className="px-4 py-2 text-left border-b w-48 cursor-pointer hover:bg-gray-200"
								onClick={() => requestSort("name")}
							>
								Nombre {getSortIndicator("name")}
							</th>
							<th className="px-4 py-2 text-left border-b w-64">URL</th>
							<th
								className="px-4 py-2 text-left border-b w-24 cursor-pointer hover:bg-gray-200"
								onClick={() => requestSort("size")}
							>
								Tamaño {getSortIndicator("size")}
							</th>
							<th
								className="px-4 py-2 text-left border-b w-44 cursor-pointer hover:bg-gray-200"
								onClick={() => requestSort("date")}
							>
								Fecha {getSortIndicator("date")}
							</th>
							<th className="px-4 py-2 text-left border-b w-24">Ubicación</th>
							<th className="px-4 py-2 text-left border-b w-24">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{sortedFiles.map((file, i) => (
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
									<Actions
										handlePlay={() => handlePlay(file)}
										handleDelete={() => handleDelete(file, i)}
									/>
								</td>
							</tr>
						))}

						{files.length === 0 && (
							<tr>
								<td colSpan={6} className="p-4 text-center text-gray-500">
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
