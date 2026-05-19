import Link from "next/link";
import { LeaveLink } from "./leave-link";

export function AlreadyEntered({
  meetingId,
  name,
  color,
}: {
  meetingId: string;
  name: string;
  color: string;
}) {
  return (
    <>
      <section className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-md px-4 py-8">
          <div className="rounded-3xl border border-hairline-soft bg-surface-soft p-6 text-center">
            <div
              className="mx-auto h-12 w-12 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <p className="mt-4 text-base font-semibold text-ink-deep">
              이미 {name}으로 입장 중입니다
            </p>
            <p className="mt-1 text-xs text-slate">
              잘못 들어왔다면 아래 링크로 다시 선택할 수 있어요
            </p>
            <div className="mt-4 flex justify-center">
              <LeaveLink meetingId={meetingId} />
            </div>
          </div>
        </div>
      </section>
      <footer className="shrink-0 border-t border-hairline-soft bg-canvas">
        <div
          className="mx-auto w-full max-w-md px-4 pt-4"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
        >
          <Link
            href={`/m/${meetingId}/result`}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-deep px-6 py-4 text-base font-bold text-canvas transition active:bg-charcoal"
          >
            결과 보기
          </Link>
        </div>
      </footer>
    </>
  );
}
