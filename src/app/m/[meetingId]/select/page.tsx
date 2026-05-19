import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Check } from "lucide-react";
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
    <main className="flex h-dvh flex-col bg-canvas">
      <header className="shrink-0 border-b border-hairline-soft bg-canvas">
        <div className="mx-auto w-full max-w-md px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-ink-deep">
            {meeting.title}
          </h1>
          <p className="mt-1 text-sm text-slate">
            가능한 날짜를 모두 탭해서 선택해주세요
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span
              className="h-4 w-4 shrink-0 rounded-full border border-hairline-soft"
              style={{ backgroundColor: currentParticipant.color }}
              aria-hidden
            />
            <span className="text-sm font-semibold text-ink-deep">
              {currentParticipant.name}
            </span>
          </div>
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-md px-4 py-4 pb-6">
          <SelectCalendar
            meetingId={meeting.id}
            dateRangeStart={meeting.date_range_start}
            dateRangeEnd={meeting.date_range_end}
            participants={participants ?? []}
            currentParticipantId={currentParticipant.id}
            initialAvailabilities={availabilities ?? []}
          />
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
            <Check className="h-5 w-5" />
            <span>다 골랐어요</span>
          </Link>
        </div>
      </footer>
    </main>
  );
}
