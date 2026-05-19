export function EnterHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="shrink-0 border-b border-hairline-soft bg-canvas">
      <div className="mx-auto w-full max-w-md px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink-deep">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
