import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  PrimaryFooterLink,
  StickyFooter,
} from "@/components/layout/sticky-footer";
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
  if (!meeting.confirmed_date) redirect("/");

  const formattedDate = format(
    parseISO(meeting.confirmed_date),
    "yyyy년 M월 d일 EEEE",
    { locale: ko },
  );

  return (
    <AppShell
      header={<PageHeader title="약속 확정" />}
      footer={
        <StickyFooter
          back={{ fallbackHref: `/m/${meeting.id}/result` }}
          primary={
            <PrimaryFooterLink href={`/m/${meeting.id}/result`}>
              결과 화면 보기
            </PrimaryFooterLink>
          }
        />
      }
    >
      <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center px-6 py-12">
        <p className="text-6xl" aria-hidden>
          🎉
        </p>
        <p className="mt-4 text-sm text-slate">약속이 확정되었어요</p>
        <div className="mt-6 w-full space-y-2 rounded-3xl border border-hairline-soft bg-surface-soft px-6 py-8 text-center">
          <p className="text-sm text-slate">{meeting.title}</p>
          <p className="text-2xl font-bold text-ink-deep">{formattedDate}</p>
        </div>
      </div>
    </AppShell>
  );
}
