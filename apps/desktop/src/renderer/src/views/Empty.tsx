export function EmptyScreen({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string | null;
}): JSX.Element {
  return (
    <div className="screen-empty">
      <h1>{title}</h1>
      {subtitle && <div>{subtitle}</div>}
      <div>En attente du plateau…</div>
    </div>
  );
}
