"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { participantCookieKey } from "@/lib/colors";

export async function toggleAvailability(input: {
  meetingId: string;
  participantId: string;
  date: string;
}) {
  // 본인만 수정 가능: 쿠키의 participantId와 일치해야 함
  const cookieStore = await cookies();
  const cookieParticipantId = cookieStore.get(
    participantCookieKey(input.meetingId),
  )?.value;
  if (cookieParticipantId !== input.participantId) {
    return { error: "권한이 없습니다" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("availabilities")
    .select("id")
    .eq("participant_id", input.participantId)
    .eq("available_date", input.date)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("availabilities")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: "저장에 실패했습니다" };
  } else {
    const { error } = await supabase
      .from("availabilities")
      .insert({
        participant_id: input.participantId,
        available_date: input.date,
      });
    if (error) return { error: "저장에 실패했습니다" };
  }

  revalidatePath(`/m/${input.meetingId}/select`);
  revalidatePath(`/m/${input.meetingId}/result`);
  return { success: true };
}
