export default function Actions(props) {
	function handleDelete() {
		props.handleDelete();
	}
	return (
		<>
			<ul className="flex items-center list-none p-0 m-0 gap-2">
				<li id="play" className="w-6 cursor-pointer">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 384 512"
						className="fill-green-500 hover:fill-green-600"
					>
						<path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" />
					</svg>
				</li>
				<li id="delete" className="w-6 cursor-pointer" onClick={handleDelete}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 448 512"
						className="fill-red-500 hover:fill-red-600"
					>
						<path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" />
					</svg>
				</li>
				<li></li>
			</ul>
		</>
	);
}
