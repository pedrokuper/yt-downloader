export default function Options({ options = [] }) {
	return (
		<select className="border">
			{options?.map((o) => {
				return <option value={o.value}>{o.label}</option>;
			})}
		</select>
	);
}
