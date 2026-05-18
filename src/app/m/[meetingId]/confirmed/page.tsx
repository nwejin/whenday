import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ meetingId: string }>;

export default async function ConfirmedPage({
  params,
}: {
  params: Params;
}) {
  const { meetingId } = await params;
  const supabase = await createClient();

  const { data: meeting, error } = await supabase
    .from("meetings")
    .select("id, title, confirmed_date")
    .eq("id", meetingId)
    .single();

  if (error || !meeting) notFound();
  if (!meeting.confirmed_date) notFound();

  const formattedDate = format(
    parseISO(meeting.confirmed_date),
    "yyyy년 M월 d일 EEEE",
    { locale: ko },
  );

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-6xl">🎉</p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            약속이 확정되었어요
          </h1>
        </div>

        <div className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-8">
          <p className="text-sm text-gray-500">{meeting.title}</p>
          <p className="text-2xl font-bold text-gray-900">{formattedDate}</p>
        </div>

        <Link
          href={`/m/${meeting.id}/result`}
          className="block text-sm text-gray-500 underline underline-offset-2"
        >
          결과 화면 보기
        </Link>
      </div>
    </main>
  );
}
