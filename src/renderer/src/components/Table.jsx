export default function Table({ files = [] }) {
	if (files.length < 1) return null;

	//TODO - Make into lib/utils
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

	return (
		<>
			<button className="bg-slate-500 px-2 hover:bg-slate-700 text-white">
				Limpiar Historial
			</button>
			<div className="w-full overflow-x-auto h-[500px]">
				<table className="w-full border-collapse min-w-full">
					<thead>
						<tr className="bg-gray-100">
							<th className="text-left p-2 border-b font-semibold w-48">
								Nombre
							</th>
							<th className="text-left p-2 border-b font-semibold w-64">URL</th>
							<th className="text-left p-2 border-b font-semibold w-24">
								Tamaño
							</th>
							<th className="text-left p-2 border-b font-semibold flex-1">
								Ubicación
							</th>
							{/* <th className="text-left p-2 border-b font-semibold flex-1">
								Fecha
							</th> */}
						</tr>
					</thead>
					<tbody>
						{files.map((file, index) => (
							<tr key={index} className="border-b hover:bg-gray-50">
								<td className="p-2 max-w-[12rem]">
									<div className="truncate" title={file.name}>
										{file.name}
									</div>
								</td>
								<td className="p-2 max-w-[16rem]">
									<div className="truncate">
										<a
											className="hover:bg-sky-300 underline"
											target="_blank"
											href={file.url}
											title={file.url}
										>
											{file.url}
										</a>
									</div>
								</td>
								<td className="p-2 w-24">{file.size}</td>
								<td className="p-2 max-w-[24rem]">
									<div
										className="truncate cursor-pointer hover:text-blue-600"
										onClick={() => handleShowFile(file.location)}
										title={file.location}
									>
										{file.location}
									</div>
								</td>
							</tr>
						))}
						{files.length === 0 && (
							<tr>
								<td colSpan={4} className="p-4 text-center text-gray-500">
									No files available
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</>
	);
}
