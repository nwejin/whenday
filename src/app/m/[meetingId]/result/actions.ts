"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { participantCookieKey } from "@/lib/colors";

export async function confirmMeeting(input: {
  meetingId: string;
  date: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다" };

  const { error } = await supabase
    .from("meetings")
    .update({ confirmed_date: input.date })
    .eq("id", input.meetingId)
    .eq("host_id", user.id);

  if (error) return { error: "확정에 실패했습니다" };

  revalidatePath(`/m/${input.meetingId}`, "layout");
  redirect(`/m/${input.meetingId}/confirmed`);
}

export async function unconfirmMeeting(input: { meetingId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다" };

  const { error } = await supabase
    .from("meetings")
    .update({ confirmed_date: null })
    .eq("id", input.meetingId)
    .eq("host_id", user.id);

  if (error) return { error: "취소에 실패했습니다" };

  revalidatePath(`/m/${input.meetingId}`, "layout");
  return { success: true };
}

export async function deleteMeeting(input: { meetingId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다" };

  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("id", input.meetingId)
    .eq("host_id", user.id);

  if (error) return { error: "삭제에 실패했습니다" };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function toggleAvailability(input: {
  meetingId: string;
  participantId: string;
  date: string;
}) {
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
    const { error } = await supabase.from("availabilities").insert({
      participant_id: input.participantId,
      available_date: input.date,
    });
    if (error) return { error: "저장에 실패했습니다" };
  }

  revalidatePath(`/m/${input.meetingId}/result`);
  return { success: true };
}
