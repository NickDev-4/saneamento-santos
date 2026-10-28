export function Metric({
  icon,
  value,
  label,
  note,
  color,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  note: string;
  color: string;
}) {
  return (
    <article className={`metric metric-${color}`}>
      <div>
        <span>{icon}</span>
        <strong>{value}</strong>
      </div>
      <h2>{label}</h2>
      <p>{note}</p>
    </article>
  );
}
