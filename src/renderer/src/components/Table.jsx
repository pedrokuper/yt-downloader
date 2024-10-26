export default function Table({ files = [] }) {
	if (files.length < 1) return null;
	return (
		<>
			<div className="flex flex-col items-center justify-center">
				<h2 className="text-center underline font-bold mb-2">Historial</h2>
				{/* <button className="border bg-slate-400 p-1 my-2">
					Limpiar historial
				</button> */}
			</div>
			<div className="w-full overflow-x-auto h-[500px]">
				<table className="w-full border-collapse min-w-full">
					<thead>
						<tr className="bg-gray-100">
							<th className="text-left p-2 border-b font-semibold">Name</th>
							<th className="text-left p-2 border-b font-semibold">Size</th>
							<th className="text-left p-2 border-b font-semibold">Location</th>
						</tr>
					</thead>
					<tbody>
						{files.map((file, index) => (
							<tr key={index} className="border-b hover:bg-gray-50">
								<td className="p-2">{file.name}</td>
								<td className="p-2">{file.size}</td>
								<td
									className="p-2 cursor-pointer"
									onClick={() => alert("Abre la localizacion del archivo")}
								>
									{file.location}
								</td>
							</tr>
						))}
						{files.length === 0 && (
							<tr>
								<td colSpan={3} className="p-4 text-center text-gray-500">
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
