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

  return (
    <main className="flex flex-1 justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <header className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {meeting.title}
            </h1>
            {isHost && (
              <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                방장
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {meeting.date_range_start} ~ {meeting.date_range_end}
          </p>
        </header>

        {!currentParticipant ? (
          <Link
            href={`/m/${meeting.id}`}
            className="block rounded-2xl bg-gray-900 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-gray-800"
          >
            본인 이름·색상 선택하기
          </Link>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-900 bg-white px-4 py-3">
              <span
                className="h-5 w-5 shrink-0 rounded-full border border-gray-200"
                style={{
                  backgroundColor: currentParticipant.color ?? "transparent",
                }}
              />
              <div className="flex-1">
                <p className="text-xs text-gray-500">현재 입장</p>
                <p className="text-sm font-semibold text-gray-900">
                  {currentParticipant.name}
                </p>
              </div>
            </div>
            <Link
              href={`/m/${meeting.id}/select`}
              className="block rounded-2xl bg-gray-900 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-gray-800"
            >
              가능한 날짜 입력하기
            </Link>
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
          <h2 className="text-sm font-medium text-gray-900">
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
                      ? "flex items-center gap-3 rounded-xl border-2 border-gray-900 px-3 py-2.5"
                      : "flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5"
                  }
                >
                  <span
                    className="h-5 w-5 shrink-0 rounded-full border border-gray-200"
                    style={{ backgroundColor: p.color ?? "transparent" }}
                    aria-label={
                      p.color ? `${p.name}의 색상` : `${p.name} 미입력`
                    }
                  />
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {p.name}
                    {isMe && (
                      <span className="ml-1.5 text-xs text-gray-400">
                        (나)
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-400">
                    {p.color ? "입력 가능" : "미입력"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
