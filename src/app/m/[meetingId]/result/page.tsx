import { notFound } from "next/navigation";
import { headers, cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { participantCookieKey } from "@/lib/colors";
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
  const currentParticipantId =
    cookieStore.get(participantCookieKey(meeting.id))?.value ?? null;
  const currentParticipant = (participants ?? []).find(
    (p) => p.id === currentParticipantId,
  );
  const validCurrentParticipantId =
    currentParticipant && currentParticipant.color ? currentParticipantId : null;

  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const shareUrl = `${proto}://${host}/m/${meeting.id}`;

  return (
    <ResultView
      meetingId={meeting.id}
      title={meeting.title}
      dateRangeStart={meeting.date_range_start}
      dateRangeEnd={meeting.date_range_end}
      isHost={isHost}
      confirmedDate={meeting.confirmed_date}
      participants={participants ?? []}
      availabilities={availabilities ?? []}
      currentParticipantId={validCurrentParticipantId}
      shareUrl={shareUrl}
    />
  );
}
