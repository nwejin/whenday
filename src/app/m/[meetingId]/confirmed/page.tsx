import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ meetingId: string }>;

export default async function ConfirmedPage({
  params,
}: {
  params: Params;
}) {
  const { meetingId } = await params;
  const supabase = await createClient();

  const { data: meeting, error } = await supabase
    .from("meetings")
    .select("id, title, confirmed_date")
    .eq("id", meetingId)
    .single();

  if (error || !meeting) notFound();
  if (!meeting.confirmed_date) notFound();

  const formattedDate = format(
    parseISO(meeting.confirmed_date),
    "yyyy년 M월 d일 EEEE",
    { locale: ko },
  );

  return (
    <main className="flex h-dvh flex-col bg-canvas">
      <header className="shrink-0 border-b border-hairline-soft bg-canvas">
        <div className="mx-auto w-full max-w-md px-4 py-5 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-ink-deep">
            약속 확정
          </h1>
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center px-4 py-6">
          <p className="text-6xl" aria-hidden>
            🎉
          </p>
          <p className="mt-4 text-sm text-slate">약속이 확정되었어요</p>
          <div className="mt-6 w-full space-y-2 rounded-3xl border border-hairline-soft bg-surface-soft px-6 py-8 text-center">
            <p className="text-sm text-slate">{meeting.title}</p>
            <p className="text-2xl font-bold text-ink-deep">{formattedDate}</p>
          </div>
        </div>
      </section>

      <footer className="shrink-0 border-t border-hairline-soft bg-canvas">
        <div
          className="mx-auto w-full max-w-md px-4 pt-4"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
        >
          <Link
            href={`/m/${meeting.id}/result`}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-deep px-6 py-4 text-base font-bold text-canvas transition active:bg-charcoal"
          >
            결과 화면 보기
          </Link>
        </div>
      </footer>
    </main>
  );
}
