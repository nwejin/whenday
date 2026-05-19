"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { participantCookieKey } from "@/lib/colors";

export async function pickColor(input: {
  meetingId: string;
  participantId: string;
  color: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("participants")
    .update({ color: input.color })
    .eq("id", input.participantId)
    .eq("meeting_id", input.meetingId);

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 다른 참여자가 선택한 색상입니다" };
    }
    return { error: "입장에 실패했습니다" };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    participantCookieKey(input.meetingId),
    input.participantId,
    {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      path: "/",
    },
  );

  revalidatePath(`/m/${input.meetingId}`, "layout");
  redirect(`/m/${input.meetingId}/result`);
}

export async function leaveAsCurrentParticipant(formData: FormData) {
  const meetingId = formData.get("meetingId");
  if (typeof meetingId !== "string" || !meetingId) return;

  const cookieStore = await cookies();
  cookieStore.delete(participantCookieKey(meetingId));

  revalidatePath(`/m/${meetingId}`, "layout");
}
