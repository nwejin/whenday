"use client";

import { useEffect, useRef, useState } from "react";

type PickerOption = { value: number; label: string };

export function DatePicker({
  value,
  onChange,
  minYear,
  maxYear,
}: {
  value: string;
  onChange: (next: string) => void;
  minYear: number;
  maxYear: number;
}) {
  const [yStr, mStr, dStr] = value.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);

  const yearOptions = range(minYear, maxYear).map((year) => ({
    value: year,
    label: `${year}년`,
  }));
  const monthOptions = range(1, 12).map((month) => ({
    value: month,
    label: `${month}월`,
  }));
  const daysInMonth = new Date(y, m, 0).getDate();
  const dayOptions = range(1, daysInMonth).map((day) => ({
    value: day,
    label: `${day}일`,
  }));

  function update(part: "y" | "m" | "d", val: number) {
    let nextY = y;
    let nextM = m;
    let nextD = d;
    if (part === "y") nextY = val;
    else if (part === "m") nextM = val;
    else nextD = val;

    const maxDay = new Date(nextY, nextM, 0).getDate();
    if (nextD > maxDay) nextD = maxDay;

    onChange(
      `${nextY}-${String(nextM).padStart(2, "0")}-${String(nextD).padStart(2, "0")}`,
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <Picker value={y} onChange={(v) => update("y", v)} options={yearOptions} />
      <Picker value={m} onChange={(v) => update("m", v)} options={monthOptions} />
      <Picker value={d} onChange={(v) => update("d", v)} options={dayOptions} />
    </div>
  );
}

function Picker({
  value,
  onChange,
  options,
}: {
  value: number;
  onChange: (next: number) => void;
  options: PickerOption[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const selectedEl = listRef.current?.querySelector<HTMLElement>(
      '[data-selected="true"]',
    );
    selectedEl?.scrollIntoView({ block: "nearest" });
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-hairline-soft bg-canvas px-3 py-3 text-base text-ink-deep outline-none transition focus:border-ink-deep"
      >
        <span>{selected?.label}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`h-4 w-4 text-stone transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded-xl border border-hairline-soft bg-canvas py-1 shadow-lg"
        >
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  data-selected={isActive}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={
                    isActive
                      ? "block w-full bg-ink-deep px-3 py-2.5 text-left text-base font-medium text-canvas"
                      : "block w-full px-3 py-2.5 text-left text-base text-ink transition active:bg-surface-soft"
                  }
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
