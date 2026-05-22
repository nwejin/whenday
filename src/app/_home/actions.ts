"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteMeetings(meetingIds: string[]) {
  if (meetingIds.length === 0) return { success: true };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다" };

  const { error } = await supabase
    .from("meetings")
    .delete()
    .in("id", meetingIds)
    .eq("host_id", user.id);

  if (error) return { error: "삭제에 실패했습니다" };

  revalidatePath("/", "layout");
  return { success: true };
}
