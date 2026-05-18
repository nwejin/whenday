"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
