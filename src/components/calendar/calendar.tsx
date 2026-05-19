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

type SelectMode = {
  mode: "select";
  currentParticipantId: string;
  onToggleDate: (date: string) => void;
};

type ResultMode = {
  mode: "result";
  onCellClick?: (date: string) => void;
};

type Props = {
  dateRangeStart: string;
  dateRangeEnd: string;
  participants: Participant[];
  availabilities: Availability[];
} & (SelectMode | ResultMode);

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const EMPTY_SLOT_COLOR = "var(--color-surface-soft)";
const PARTICIPANT_FALLBACK_COLOR = "var(--color-stone)";

type DragState = {
  fillMode: "add" | "remove";
  visited: Set<string>;
};

export function Calendar(props: Props) {
  const { dateRangeStart, dateRangeEnd, participants, availabilities } = props;

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

  const dragStateRef = useRef<DragState | null>(null);

  function isAvailableForCurrent(date: string): boolean {
    if (props.mode !== "select") return false;
    return availabilities.some(
      (a) =>
        a.participant_id === props.currentParticipantId &&
        a.available_date === date,
    );
  }

  function handleCellPointerDown(date: string) {
    if (props.mode !== "select") return;
    const currentlyAvailable = isAvailableForCurrent(date);
    dragStateRef.current = {
      fillMode: currentlyAvailable ? "remove" : "add",
      visited: new Set([date]),
    };
    props.onToggleDate(date);
  }

  function applyDragToCell(date: string) {
    if (props.mode !== "select") return;
    const drag = dragStateRef.current;
    if (!drag) return;
    if (drag.visited.has(date)) return;
    drag.visited.add(date);
    const currentlyAvailable = isAvailableForCurrent(date);
    if (
      (drag.fillMode === "add" && currentlyAvailable) ||
      (drag.fillMode === "remove" && !currentlyAvailable)
    ) {
      return; // 이미 원하는 상태
    }
    props.onToggleDate(date);
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
    dragStateRef.current = null;
  }

  const isSelectMode = props.mode === "select";

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          aria-label="이전 달"
          className="rounded-xl px-3 py-2 text-charcoal transition active:bg-surface-soft disabled:opacity-30"
        >
          ←
        </button>
        <h2 className="text-base font-semibold text-ink-deep">
          {format(viewMonth, "yyyy년 M월")}
        </h2>
        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
          aria-label="다음 달"
          className="rounded-xl px-3 py-2 text-charcoal transition active:bg-surface-soft disabled:opacity-30"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-stone"
          >
            {day}
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-hairline-soft bg-hairline-soft"
        onPointerMove={isSelectMode ? handleGridPointerMove : undefined}
        onPointerUp={isSelectMode ? endDrag : undefined}
        onPointerCancel={isSelectMode ? endDrag : undefined}
        onPointerLeave={isSelectMode ? endDrag : undefined}
        style={isSelectMode ? { touchAction: "none" } : undefined}
      >
        {cells.map((date, idx) => {
          if (!date) {
            return <div key={idx} className="aspect-square bg-surface-soft" />;
          }
          const inRange = date >= startDate && date <= endDate;
          const dateKey = format(date, "yyyy-MM-dd");
          const availableSet = availabilityByDate.get(dateKey) ?? new Set();
          const availableCount = availableSet.size;
          const isAllAvailable =
            totalParticipants > 0 && availableCount === totalParticipants;

          const cellContent = (
            <CellContent
              date={date}
              inRange={inRange}
              isAllAvailable={isAllAvailable}
              participants={participants}
              availableSet={availableSet}
              currentParticipantId={
                props.mode === "select" ? props.currentParticipantId : undefined
              }
            />
          );

          const baseCellClass = inRange
            ? "aspect-square bg-canvas"
            : "aspect-square bg-surface-soft opacity-40";

          if (inRange && props.mode === "select") {
            return (
              <button
                key={idx}
                type="button"
                data-date={dateKey}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleCellPointerDown(dateKey);
                }}
                className={`${baseCellClass} text-left transition active:bg-surface-soft`}
              >
                {cellContent}
              </button>
            );
          }

          if (inRange && props.mode === "result" && props.onCellClick) {
            const onCellClick = props.onCellClick;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onCellClick(dateKey)}
                className={`${baseCellClass} text-left transition active:bg-surface-soft`}
              >
                {cellContent}
              </button>
            );
          }

          return (
            <div key={idx} className={baseCellClass}>
              {cellContent}
            </div>
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
}: {
  date: Date;
  inRange: boolean;
  isAllAvailable: boolean;
  participants: Participant[];
  availableSet: Set<string>;
  currentParticipantId?: string;
}) {
  return (
    <div className="flex h-full flex-col p-1">
      <div className="flex items-start justify-between">
        <span
          className={
            inRange ? "text-xs text-ink" : "text-xs text-stone"
          }
        >
          {date.getDate()}
        </span>
        {inRange && isAllAvailable && (
          <span className="text-[10px]" aria-label="모두 가능">
            ⭐
          </span>
        )}
      </div>
      {inRange && participants.length > 0 && (
        <div className="mt-1 flex flex-1 flex-col gap-px">
          {participants.map((p) => {
            const isAvailable = availableSet.has(p.id);
            const isMe = currentParticipantId === p.id;
            const isDimmed = currentParticipantId !== undefined && !isMe;
            return (
              <div
                key={p.id}
                className="min-h-0.75 flex-1 rounded-[1px]"
                style={{
                  backgroundColor: isAvailable
                    ? (p.color ?? PARTICIPANT_FALLBACK_COLOR)
                    : EMPTY_SLOT_COLOR,
                  opacity: isDimmed ? 0.4 : 1,
                }}
                aria-label={`${p.name}: ${isAvailable ? "가능" : "미선택"}`}
              />
            );
          })}
        </div>
      )}
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
