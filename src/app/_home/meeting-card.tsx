import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Check, ChevronRight } from "lucide-react";

export type Meeting = {
  id: string;
  title: string;
  date_range_start: string;
  date_range_end: string;
  confirmed_date: string | null;
  participantCount: number;
};

function formatRange(start: string, end: string): string {
  return `${format(parseISO(start), "M.d")} ~ ${format(parseISO(end), "M.d")}`;
}

function formatConfirmed(date: string): string {
  return format(parseISO(date), "M.d (EEE)");
}

const BASE_CARD =
  "flex items-center gap-4 rounded-2xl border px-5 py-4 transition " +
  "shadow-[0_1px_2px_rgba(20,22,26,0.04),0_8px_24px_-8px_rgba(20,22,26,0.10)] " +
  "active:scale-[0.99] active:shadow-[0_1px_2px_rgba(20,22,26,0.04)]";

type Props = {
  meeting: Meeting;
  editMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
};

export function MeetingCard({
  meeting,
  editMode = false,
  selected = false,
  onToggleSelect,
}: Props) {
  const isConfirmed = !!meeting.confirmed_date;

  const cardClass = editMode
    ? selected
      ? `${BASE_CARD} border-ink-deep bg-surface-soft`
      : `${BASE_CARD} border-hairline-soft bg-canvas`
    : isConfirmed
      ? `${BASE_CARD} border-success/20 bg-success/4`
      : `${BASE_CARD} border-hairline-soft bg-canvas`;

  const content = (
    <>
      {editMode ? (
        <span
          aria-hidden
          className={
            selected
              ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-deep text-canvas"
              : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-hairline bg-canvas"
          }
        >
          {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
        </span>
      ) : null}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span
            className={
              isConfirmed
                ? "shrink-0 rounded-full bg-success px-2 py-0.5 text-[10px] font-bold tracking-wide text-canvas"
                : "shrink-0 rounded-full bg-surface-soft px-2 py-0.5 text-[10px] font-bold tracking-wide text-charcoal"
            }
          >
            {isConfirmed ? "확정" : "진행중"}
          </span>
          <p className="truncate text-sm font-semibold text-ink-deep">
            {meeting.title}
          </p>
        </div>
        <p className="text-xs text-slate">
          {isConfirmed
            ? `${formatConfirmed(meeting.confirmed_date!)} 확정`
            : formatRange(meeting.date_range_start, meeting.date_range_end)}
          <span className="mx-1.5 text-stone">·</span>
          {meeting.participantCount}명
        </p>
      </div>
      {!editMode ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-stone" />
      ) : null}
    </>
  );

  if (editMode) {
    return (
      <button
        type="button"
        onClick={() => onToggleSelect?.(meeting.id)}
        className={`${cardClass} text-left`}
        aria-pressed={selected}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={`/m/${meeting.id}/result`} className={cardClass}>
      {content}
    </Link>
  );
}
