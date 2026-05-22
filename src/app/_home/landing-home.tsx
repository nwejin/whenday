import { AppShell } from "@/components/layout/app-shell";
import { PrimaryFooterLink } from "@/components/layout/sticky-footer";

export function LandingHome() {
  return (
    <AppShell
      header={
        <header className="shrink-0 bg-canvas">
          <div className="mx-auto w-full max-w-md px-4 pt-6 pb-2">
            <p className="text-xl font-bold tracking-tight text-ink-deep">
              whenday
            </p>
          </div>
        </header>
      }
      footer={
        <footer
          className="shrink-0 bg-canvas"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
        >
          <div className="mx-auto w-full max-w-md px-4 pt-4">
            <PrimaryFooterLink href="/login">지금 시작</PrimaryFooterLink>
          </div>
        </footer>
      }
    >
      <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center gap-10 px-6 py-12">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-ink-deep">
            약속,
            <br />한 번에 잡아요
          </h2>
          <p className="text-base leading-relaxed text-slate">
            여러 명이 모이는 약속,
            <br />
            가능한 날짜를 빠르게 찾아드려요.
          </p>
        </div>

        <ul className="space-y-3 text-sm text-charcoal">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-deep text-xs font-bold text-canvas">
              1
            </span>
            <span className="pt-0.5">방장이 약속과 참여자 명단을 만들어요</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-deep text-xs font-bold text-canvas">
              2
            </span>
            <span className="pt-0.5">참여자에게 링크를 공유해요</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-deep text-xs font-bold text-canvas">
              3
            </span>
            <span className="pt-0.5">모두 가능한 날짜로 확정해요</span>
          </li>
        </ul>
      </div>
    </AppShell>
  );
}
