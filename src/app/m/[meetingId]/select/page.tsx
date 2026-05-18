import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { participantCookieKey } from "@/lib/colors";
import { SelectCalendar } from "./select-calendar";

type Params = Promise<{ meetingId: string }>;

export default async function MeetingSelectPage({
  params,
}: {
  params: Params;
}) {
  const { meetingId } = await params;
  const supabase = await createClient();

  const { data: meeting, error } = await supabase
    .from("meetings")
    .select("id, title, date_range_start, date_range_end")
    .eq("id", meetingId)
    .single();

  if (error || !meeting) notFound();

  const { data: participants } = await supabase
    .from("participants")
    .select("id, name, color, display_order")
    .eq("meeting_id", meetingId)
    .order("display_order", { ascending: true });

  const cookieStore = await cookies();
  const currentParticipantId = cookieStore.get(
    participantCookieKey(meetingId),
  )?.value;
  const currentParticipant = (participants ?? []).find(
    (p) => p.id === currentParticipantId,
  );

  // 입장(색상 선택) 안 한 사용자는 입장 화면으로
  if (!currentParticipant || !currentParticipant.color) {
    redirect(`/m/${meetingId}`);
  }

  const participantIds = (participants ?? []).map((p) => p.id);
  const { data: availabilities } =
    participantIds.length > 0
      ? await supabase
          .from("availabilities")
          .select("participant_id, available_date")
          .in("participant_id", participantIds)
      : { data: [] };

  return (
    <main className="flex flex-1 justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{meeting.title}</h1>
          <p className="text-sm text-gray-500">
            가능한 날짜를 모두 탭해서 선택해주세요
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span
              className="h-4 w-4 shrink-0 rounded-full border border-gray-200"
              style={{
                backgroundColor: currentParticipant.color ?? "transparent",
              }}
            />
            <span className="text-sm font-medium text-gray-900">
              {currentParticipant.name}
            </span>
          </div>
        </header>

        <SelectCalendar
          meetingId={meeting.id}
          dateRangeStart={meeting.date_range_start}
          dateRangeEnd={meeting.date_range_end}
          participants={participants ?? []}
          currentParticipantId={currentParticipant.id}
          initialAvailabilities={availabilities ?? []}
        />

        <Link
          href={`/m/${meeting.id}/result`}
          className="block rounded-2xl border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          결과 화면 보기
        </Link>
      </div>
    </main>
  );
}
