import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { participantCookieKey } from "@/lib/colors";
import { EnterForm } from "./enter-form";
import { AlreadyEntered } from "./already-entered";

type Params = Promise<{ meetingId: string }>;

export default async function MeetingEnterPage({
  params,
}: {
  params: Params;
}) {
  const { meetingId } = await params;
  const supabase = await createClient();

  const { data: meeting, error } = await supabase
    .from("meetings")
    .select("id, title")
    .eq("id", meetingId)
    .single();

  if (error || !meeting) notFound();

  const { data: participants } = await supabase
    .from("participants")
    .select("id, name, color, display_order")
    .eq("meeting_id", meetingId)
    .order("display_order", { ascending: true });

  const cookieStore = await cookies();
  const existingId = cookieStore.get(participantCookieKey(meetingId))?.value;
  const existing = (participants ?? []).find((p) => p.id === existingId);
  const isAlreadyEntered = Boolean(existing?.color);

  if (isAlreadyEntered && existing) {
    return (
      <AlreadyEntered
        meetingId={meeting.id}
        title={meeting.title}
        name={existing.name}
        color={existing.color as string}
      />
    );
  }

  return (
    <EnterForm
      meetingId={meeting.id}
      title={meeting.title}
      participants={participants ?? []}
    />
  );
}
