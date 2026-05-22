import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  PrimaryFooterLink,
  StickyFooter,
} from "@/components/layout/sticky-footer";
import { LeaveLink } from "./leave-link";

export function AlreadyEntered({
  meetingId,
  title,
  name,
  color,
}: {
  meetingId: string;
  title: string;
  name: string;
  color: string;
}) {
  return (
    <AppShell
      header={<PageHeader title={title} />}
      footer={
        <StickyFooter
          back={{ fallbackHref: "/" }}
          primary={
            <PrimaryFooterLink href={`/m/${meetingId}/result`}>
              가능한 날짜 고르기
            </PrimaryFooterLink>
          }
        />
      }
    >
      <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center gap-6 px-6 py-12">
        <div
          className="h-16 w-16 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <div className="space-y-1 text-center">
          <p className="text-base font-bold text-ink-deep">
            {name}으로 입장 중이에요
          </p>
          <p className="text-sm text-slate">
            아래 버튼으로 가능한 날짜를 골라주세요
          </p>
        </div>
        <LeaveLink meetingId={meetingId} />
      </div>
    </AppShell>
  );
}
