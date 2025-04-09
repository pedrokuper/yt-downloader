export default function ConfirmDialog({
	open,
	onCancel,
	onConfirm,
	message = "¿Estás seguro?",
}) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
			<div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
				<p className="text-gray-800 text-center mb-4">{message}</p>
				<div className="flex justify-end gap-2">
					<button
						onClick={onCancel}
						className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
					>
						Cancelar
					</button>
					<button
						onClick={onConfirm}
						className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
					>
						Eliminar
					</button>
				</div>
			</div>
		</div>
	);
}
