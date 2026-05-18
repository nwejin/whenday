"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type CreateMeetingInput = {
  title: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  participants: string[];
};

function validate(input: CreateMeetingInput): string | null {
  if (!input.title.trim()) return "제목을 입력해주세요";
  if (input.title.length > 50) return "제목은 50자 이하여야 합니다";
  if (input.participants.length < 2)
    return "참여자는 최소 2명이어야 합니다";
  if (input.participants.length > 8)
    return "참여자는 최대 8명까지 등록할 수 있어요";
  if (new Set(input.participants).size !== input.participants.length)
    return "참여자 이름이 중복됩니다";
  if (input.dateRangeStart > input.dateRangeEnd)
    return "종료일은 시작일 이후여야 합니다";
  return null;
}

export async function createMeeting(input: CreateMeetingInput) {
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다" };

  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .insert({
      host_id: user.id,
      title: input.title.trim(),
      date_range_start: input.dateRangeStart,
      date_range_end: input.dateRangeEnd,
    })
    .select("id")
    .single();

  if (meetingError || !meeting) {
    return { error: meetingError?.message ?? "약속 생성에 실패했습니다" };
  }

  const participantsToInsert = input.participants.map((name, index) => ({
    meeting_id: meeting.id,
    name: name.trim(),
    display_order: index,
  }));

  const { error: partError } = await supabase
    .from("participants")
    .insert(participantsToInsert);

  if (partError) {
    // 참여자 INSERT 실패 — meeting 롤백 (CASCADE로 자식 행도 정리됨)
    await supabase.from("meetings").delete().eq("id", meeting.id);
    return { error: "참여자 등록에 실패했습니다" };
  }

  revalidatePath("/", "layout");
  redirect(`/m/${meeting.id}/result`);
}
