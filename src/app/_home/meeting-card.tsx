import Link from "next/link";
import { format, parseISO } from "date-fns";

type Meeting = {
  id: string;
  title: string;
  date_range_start: string;
  date_range_end: string;
  confirmed_date: string | null;
};

function formatRange(start: string, end: string): string {
  return `${format(parseISO(start), "M.d")} ~ ${format(parseISO(end), "M.d")}`;
}

const BASE_CARD =
  "block rounded-2xl border p-4 transition " +
  "shadow-[0_1px_2px_rgba(20,22,26,0.04),0_8px_24px_-8px_rgba(20,22,26,0.10)] " +
  "active:scale-[0.98] active:shadow-[0_1px_2px_rgba(20,22,26,0.04)]";

export function MeetingCard({ meeting }: { meeting: Meeting }) {
  const isConfirmed = !!meeting.confirmed_date;
  return (
    <Link
      href={`/m/${meeting.id}/result`}
      className={
        isConfirmed
          ? `${BASE_CARD} border-success/20 bg-success/[0.04]`
          : `${BASE_CARD} border-hairline-soft bg-canvas`
      }
    >
      <div className="space-y-2">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-ink-deep">
          {meeting.title}
        </p>
        <p className="text-xs text-slate">
          {formatRange(meeting.date_range_start, meeting.date_range_end)}
        </p>
        <span
          className={
            isConfirmed
              ? "inline-flex rounded-full bg-success px-2 py-0.5 text-[10px] font-bold tracking-wide text-canvas"
              : "inline-flex rounded-full bg-surface-soft px-2 py-0.5 text-[10px] font-bold tracking-wide text-charcoal"
          }
        >
          {isConfirmed ? "확정" : "진행중"}
        </span>
      </div>
    </Link>
  );
}
