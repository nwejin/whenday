"use client";

import { useRef, useState } from "react";
import {
  addMonths,
  format,
  getDaysInMonth,
  getDay,
  parseISO,
  startOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Participant = {
  id: string;
  name: string;
  color: string | null;
  display_order: number;
};

type Availability = {
  participant_id: string;
  available_date: string;
};

type Props = {
  dateRangeStart: string;
  dateRangeEnd: string;
  participants: Participant[];
  availabilities: Availability[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  /** 본인 슬롯 — 있으면 본인 슬롯만 강조 + 드래그/탭 토글 */
  currentParticipantId?: string;
  /** 본인이 입장한 경우의 토글 — 없으면 readonly */
  onToggleDate?: (date: string) => void;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const EMPTY_SLOT_COLOR = "var(--color-surface-soft)";
const PARTICIPANT_FALLBACK_COLOR = "var(--color-stone)";

type DragState = {
  fillMode: "add" | "remove";
  visited: Set<string>;
  startDate: string;
};

export function Calendar({
  dateRangeStart,
  dateRangeEnd,
  participants,
  availabilities,
  selectedDate,
  onSelectDate,
  currentParticipantId,
  onToggleDate,
}: Props) {
  const startDate = parseISO(dateRangeStart);
  const endDate = parseISO(dateRangeEnd);

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(startDate));
  const canGoPrev = viewMonth > startOfMonth(startDate);
  const canGoNext = viewMonth < startOfMonth(endDate);

  function goPrev() {
    if (canGoPrev) setViewMonth((m) => addMonths(m, -1));
  }
  function goNext() {
    if (canGoNext) setViewMonth((m) => addMonths(m, 1));
  }

  const cells = buildMonthCells(viewMonth);
  const availabilityByDate = groupByDate(availabilities);
  const totalParticipants = participants.length;

  const canToggle = !!currentParticipantId && !!onToggleDate;
  const dragStateRef = useRef<DragState | null>(null);

  const stripeMinHeight = totalParticipants <= 5 ? 8 : 6;
  const cellMinHeight = 32 + totalParticipants * stripeMinHeight + 8;

  function isAvailableForCurrent(date: string): boolean {
    if (!currentParticipantId) return false;
    return availabilities.some(
      (a) =>
        a.participant_id === currentParticipantId &&
        a.available_date === date,
    );
  }

  function handleCellPointerDown(date: string) {
    if (!canToggle) return;
    const currentlyAvailable = isAvailableForCurrent(date);
    dragStateRef.current = {
      fillMode: currentlyAvailable ? "remove" : "add",
      visited: new Set([date]),
      startDate: date,
    };
    onToggleDate!(date);
  }

  function applyDragToCell(date: string) {
    if (!canToggle) return;
    const drag = dragStateRef.current;
    if (!drag) return;
    if (drag.visited.has(date)) return;
    drag.visited.add(date);
    const currentlyAvailable = isAvailableForCurrent(date);
    if (
      (drag.fillMode === "add" && currentlyAvailable) ||
      (drag.fillMode === "remove" && !currentlyAvailable)
    ) {
      return;
    }
    onToggleDate!(date);
  }

  function handleGridPointerMove(e: React.PointerEvent) {
    if (!dragStateRef.current) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!(target instanceof Element)) return;
    const cell = target.closest("[data-date]");
    if (!(cell instanceof HTMLElement)) return;
    const date = cell.dataset.date;
    if (!date) return;
    applyDragToCell(date);
  }

  function endDrag() {
    const drag = dragStateRef.current;
    dragStateRef.current = null;
    if (drag && drag.visited.size === 1) {
      onSelectDate(drag.startDate);
    }
  }

  function handleReadonlyClick(date: string) {
    onSelectDate(date);
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          aria-label="이전 달"
          className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal transition active:bg-surface-soft disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-base font-bold text-ink-deep">
          {format(viewMonth, "yyyy년 M월")}
        </h2>
        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
          aria-label="다음 달"
          className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal transition active:bg-surface-soft disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-1.5 text-center text-sm font-medium text-stone"
          >
            {day}
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-hairline-soft bg-hairline-soft"
        onPointerMove={canToggle ? handleGridPointerMove : undefined}
        onPointerUp={canToggle ? endDrag : undefined}
        onPointerCancel={canToggle ? endDrag : undefined}
        onPointerLeave={canToggle ? endDrag : undefined}
        style={canToggle ? { touchAction: "none" } : undefined}
      >
        {cells.map((date, idx) => {
          if (!date) {
            return (
              <div
                key={idx}
                className="bg-surface-soft"
                style={{ minHeight: cellMinHeight }}
              />
            );
          }
          const inRange = date >= startDate && date <= endDate;
          const dateKey = format(date, "yyyy-MM-dd");
          const availableSet = availabilityByDate.get(dateKey) ?? new Set();
          const availableCount = availableSet.size;
          const isAllAvailable =
            totalParticipants > 0 && availableCount === totalParticipants;
          const isSelected = selectedDate === dateKey;

          const cellContent = (
            <CellContent
              date={date}
              inRange={inRange}
              isAllAvailable={isAllAvailable}
              participants={participants}
              availableSet={availableSet}
              currentParticipantId={currentParticipantId}
              stripeMinHeight={stripeMinHeight}
            />
          );

          const cellStyle = { minHeight: cellMinHeight };

          if (!inRange) {
            return (
              <div
                key={idx}
                className="bg-surface-soft opacity-40"
                style={cellStyle}
              >
                {cellContent}
              </div>
            );
          }

          const selectedClass = isSelected
            ? "outline outline-2 -outline-offset-2 outline-ink-deep"
            : "";

          if (canToggle) {
            return (
              <button
                key={idx}
                type="button"
                data-date={dateKey}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleCellPointerDown(dateKey);
                }}
                className={`bg-canvas text-left transition active:bg-surface-soft ${selectedClass}`}
                style={cellStyle}
              >
                {cellContent}
              </button>
            );
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleReadonlyClick(dateKey)}
              className={`bg-canvas text-left transition active:bg-surface-soft ${selectedClass}`}
              style={cellStyle}
            >
              {cellContent}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CellContent({
  date,
  inRange,
  isAllAvailable,
  participants,
  availableSet,
  currentParticipantId,
  stripeMinHeight,
}: {
  date: Date;
  inRange: boolean;
  isAllAvailable: boolean;
  participants: Participant[];
  availableSet: Set<string>;
  currentParticipantId?: string;
  stripeMinHeight: number;
}) {
  return (
    <div className="flex h-full flex-col gap-1 p-1.5">
      <div className="flex items-start">
        <span
          className={
            inRange
              ? isAllAvailable
                ? "text-sm font-bold text-ink-deep"
                : "text-sm text-ink"
              : "text-sm text-stone"
          }
        >
          {date.getDate()}
        </span>
      </div>
      {inRange && participants.length > 0 ? (
        <div className="flex flex-1 flex-col gap-px">
          {participants.map((p) => {
            const isAvailable = availableSet.has(p.id);
            const isMe = currentParticipantId === p.id;
            const isDimmed = currentParticipantId !== undefined && !isMe;
            return (
              <div
                key={p.id}
                className="flex-1 rounded-[1px]"
                style={{
                  minHeight: stripeMinHeight,
                  backgroundColor: isAvailable
                    ? (p.color ?? PARTICIPANT_FALLBACK_COLOR)
                    : EMPTY_SLOT_COLOR,
                  opacity: isDimmed ? 0.45 : 1,
                }}
                aria-label={`${p.name}: ${isAvailable ? "가능" : "미선택"}`}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function buildMonthCells(viewMonth: Date): Array<Date | null> {
  const firstDayOfWeek = getDay(viewMonth);
  const daysInMonth = getDaysInMonth(viewMonth);
  const cells: Array<Date | null> = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
  }
  while (cells.length < 42) cells.push(null);
  return cells;
}

function groupByDate(availabilities: Availability[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const a of availabilities) {
    if (!map.has(a.available_date)) map.set(a.available_date, new Set());
    map.get(a.available_date)!.add(a.participant_id);
  }
  return map;
}
