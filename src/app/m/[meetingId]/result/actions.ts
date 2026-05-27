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

export async function saveMyAvailabilities(input: {
  meetingId: string;
  participantId: string;
  dates: string[];
}) {
  const cookieStore = await cookies();
  const cookieParticipantId = cookieStore.get(
    participantCookieKey(input.meetingId),
  )?.value;

  const supabase = await createClient();

  let authorized = cookieParticipantId === input.participantId;

  if (!authorized) {
    // cookie가 없거나 mismatch — host이면 본인 participant에 한해 허용
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: meeting } = await supabase
        .from("meetings")
        .select("host_id")
        .eq("id", input.meetingId)
        .maybeSingle();
      if (meeting?.host_id === user.id) {
        const { data: participant } = await supabase
          .from("participants")
          .select("id")
          .eq("id", input.participantId)
          .eq("meeting_id", input.meetingId)
          .maybeSingle();
        authorized = !!participant;
      }
    }
  }

  if (!authorized) return { error: "권한이 없습니다" };

  const { data: existing, error: existingError } = await supabase
    .from("availabilities")
    .select("id, available_date")
    .eq("participant_id", input.participantId);

  if (existingError) return { error: "저장에 실패했습니다" };

  const desired = new Set(input.dates);
  const currentByDate = new Map<string, string>();
  for (const row of existing ?? []) {
    currentByDate.set(row.available_date, row.id);
  }

  const toDeleteIds: string[] = [];
  for (const [date, id] of currentByDate) {
    if (!desired.has(date)) toDeleteIds.push(id);
  }

  const toInsertRows: { participant_id: string; available_date: string }[] = [];
  for (const date of desired) {
    if (!currentByDate.has(date)) {
      toInsertRows.push({
        participant_id: input.participantId,
        available_date: date,
      });
    }
  }

  if (toDeleteIds.length > 0) {
    const { error } = await supabase
      .from("availabilities")
      .delete()
      .in("id", toDeleteIds);
    if (error) return { error: "저장에 실패했습니다" };
  }

  if (toInsertRows.length > 0) {
    const { error } = await supabase
      .from("availabilities")
      .insert(toInsertRows);
    if (error) return { error: "저장에 실패했습니다" };
  }

  return { success: true };
}
