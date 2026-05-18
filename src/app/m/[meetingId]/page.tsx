import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { participantCookieKey } from "@/lib/colors";
import { EnterForm } from "./enter-form";

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

  // 이미 색상까지 고른 사용자면 result로 바로 이동
  const cookieStore = await cookies();
  const existingId = cookieStore.get(participantCookieKey(meetingId))?.value;
  const existing = (participants ?? []).find((p) => p.id === existingId);
  if (existing?.color) {
    redirect(`/m/${meetingId}/result`);
  }

  return (
    <main className="flex flex-1 justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{meeting.title}</h1>
          <p className="text-sm text-gray-500">
            본인 이름과 색상을 선택해주세요
          </p>
        </header>

        <EnterForm meetingId={meeting.id} participants={participants ?? []} />
      </div>
    </main>
  );
}
