import Link from "next/link";
import { notFound } from "next/navigation";
import { headers, cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { participantCookieKey } from "@/lib/colors";
import { CopyShareLink } from "./copy-share-link";
import { ResultView } from "./result-view";

type Params = Promise<{ meetingId: string }>;

export default async function MeetingResultPage({
  params,
}: {
  params: Params;
}) {
  const { meetingId } = await params;
  const supabase = await createClient();

  const { data: meeting, error } = await supabase
    .from("meetings")
    .select(
      "id, title, date_range_start, date_range_end, confirmed_date, host_id",
    )
    .eq("id", meetingId)
    .single();

  if (error || !meeting) notFound();

  const { data: participants } = await supabase
    .from("participants")
    .select("id, name, color, display_order")
    .eq("meeting_id", meetingId)
    .order("display_order", { ascending: true });

  const participantIds = (participants ?? []).map((p) => p.id);
  const { data: availabilities } =
    participantIds.length > 0
      ? await supabase
          .from("availabilities")
          .select("participant_id, available_date")
          .in("participant_id", participantIds)
      : { data: [] };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isHost = user?.id === meeting.host_id;

  const cookieStore = await cookies();
  const currentParticipantId = cookieStore.get(
    participantCookieKey(meeting.id),
  )?.value;
  const currentParticipant = (participants ?? []).find(
    (p) => p.id === currentParticipantId,
  );

  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const shareUrl = `${proto}://${host}/m/${meeting.id}`;

  const isConfirmed = Boolean(meeting.confirmed_date);

  return (
    <main className="flex h-dvh flex-col bg-canvas">
      <header className="shrink-0 border-b border-hairline-soft bg-canvas">
        <div className="mx-auto w-full max-w-md px-4 py-5">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink-deep">
              {meeting.title}
            </h1>
            {isHost && (
              <span className="shrink-0 rounded-full bg-surface-soft px-2.5 py-0.5 text-xs font-medium text-slate">
                방장
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate">
            {meeting.date_range_start} ~ {meeting.date_range_end}
          </p>
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-md space-y-6 px-4 py-6">
          {currentParticipant && (
            <div className="flex items-center gap-3 rounded-2xl border border-ink-deep bg-canvas px-4 py-3">
              <span
                className="h-5 w-5 shrink-0 rounded-full border border-hairline-soft"
                style={{
                  backgroundColor: currentParticipant.color ?? "transparent",
                }}
              />
              <div className="flex-1">
                <p className="text-xs text-slate">현재 입장</p>
                <p className="text-sm font-semibold text-ink-deep">
                  {currentParticipant.name}
                </p>
              </div>
            </div>
          )}

          <CopyShareLink url={shareUrl} />

          <ResultView
            meetingId={meeting.id}
            isHost={isHost}
            confirmedDate={meeting.confirmed_date}
            dateRangeStart={meeting.date_range_start}
            dateRangeEnd={meeting.date_range_end}
            participants={participants ?? []}
            availabilities={availabilities ?? []}
          />

          <section className="space-y-3">
            <h2 className="text-sm font-medium text-charcoal">
              참여자 ({participants?.length ?? 0}명)
            </h2>
            <ul className="space-y-2">
              {participants?.map((p) => {
                const isMe = p.id === currentParticipantId;
                return (
                  <li
                    key={p.id}
                    className={
                      isMe
                        ? "flex items-center gap-3 rounded-xl border border-ink-deep px-3 py-2.5"
                        : "flex items-center gap-3 rounded-xl border border-hairline-soft px-3 py-2.5"
                    }
                  >
                    <span
                      className="h-5 w-5 shrink-0 rounded-full border border-hairline-soft"
                      style={{ backgroundColor: p.color ?? "transparent" }}
                      aria-label={
                        p.color ? `${p.name}의 색상` : `${p.name} 미입력`
                      }
                    />
                    <span className="flex-1 text-sm font-medium text-ink-deep">
                      {p.name}
                      {isMe && (
                        <span className="ml-1.5 text-xs text-stone">(나)</span>
                      )}
                    </span>
                    <span className="text-xs text-stone">
                      {p.color ? "입장 완료" : "미입장"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </section>

      <footer className="shrink-0 border-t border-hairline-soft bg-canvas">
        <div
          className="mx-auto w-full max-w-md px-4 pt-4"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
        >
          {isConfirmed ? (
            <Link
              href={`/m/${meeting.id}/confirmed`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-deep px-6 py-4 text-base font-bold text-canvas transition active:bg-charcoal"
            >
              확정된 날짜 보기
            </Link>
          ) : !currentParticipant ? (
            <Link
              href={`/m/${meeting.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-deep px-6 py-4 text-base font-bold text-canvas transition active:bg-charcoal"
            >
              본인 이름·색상 선택하기
            </Link>
          ) : (
            <Link
              href={`/m/${meeting.id}/select`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-deep px-6 py-4 text-base font-bold text-canvas transition active:bg-charcoal"
            >
              가능한 날짜 입력하기
            </Link>
          )}
        </div>
      </footer>
    </main>
  );
}
