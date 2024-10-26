export default function Options({ options = [], onChange, name }) {
	return (
		<select onChange={onChange} name={name} className="border">
			{options?.map((o) => {
				return (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				);
			})}
		</select>
	);
}
