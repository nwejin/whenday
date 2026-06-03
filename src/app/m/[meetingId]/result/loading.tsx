import { AppShell } from "@/components/layout/app-shell";

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-soft ${className}`} />;
}

export default function ResultLoading() {
  return (
    <AppShell
      header={
        <header className="shrink-0 border-b border-hairline-soft bg-canvas">
          <div className="mx-auto w-full max-w-md px-4 py-3">
            <Block className="h-6 w-40" />
            <div className="mt-2 flex items-center gap-2">
              <Block className="h-5 w-24 flex-1" />
              <Block className="h-9 w-28 rounded-full" />
            </div>
          </div>
        </header>
      }
      footer={
        <footer className="shrink-0 border-t border-hairline-soft bg-canvas">
          <div
            className="mx-auto w-full max-w-md px-4 pt-4"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
          >
            <Block className="h-14 w-full rounded-full" />
          </div>
        </footer>
      }
    >
      <div className="mx-auto w-full max-w-md space-y-5 px-4 py-4">
        <Block className="h-11 w-full rounded-full" />
        <Block className="h-72 w-full rounded-2xl" />
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Block key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
