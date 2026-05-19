"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { addDays, format } from "date-fns";
import { createMeeting } from "./actions";

const MAX_PARTICIPANTS = 10;
const MIN_PARTICIPANTS = 2;

type Participant = {
  id: string;
  name: string;
};

const TODAY = new Date();
const MIN_YEAR = TODAY.getFullYear();
const MAX_YEAR = MIN_YEAR + 1;

export default function NewMeetingPage() {
  const today = format(TODAY, "yyyy-MM-dd");
  const monthLater = format(addDays(TODAY, 30), "yyyy-MM-dd");

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(monthLater);
  const [participants, setParticipants] = useState<Participant[]>(() => [
    { id: "p-0", name: "" },
    { id: "p-1", name: "" },
  ]);
  const nextIdRef = useRef(2);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateParticipant(id: string, value: string) {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: value } : p)),
    );
  }

  function addParticipant() {
    setParticipants((prev) => {
      if (prev.length >= MAX_PARTICIPANTS) return prev;
      const id = `p-${nextIdRef.current++}`;
      return [...prev, { id, name: "" }];
    });
  }

  function removeParticipant(id: string) {
    setParticipants((prev) =>
      prev.length <= MIN_PARTICIPANTS ? prev : prev.filter((p) => p.id !== id),
    );
  }

  function handleSubmit() {
    const filled = participants.map((p) => p.name.trim()).filter(Boolean);

    if (!title.trim()) return setError("제목을 입력해주세요");
    if (filled.length < MIN_PARTICIPANTS)
      return setError(`참여자는 최소 ${MIN_PARTICIPANTS}명이어야 합니다`);
    if (new Set(filled).size !== filled.length)
      return setError("참여자 이름이 중복됩니다");
    if (startDate > endDate)
      return setError("종료일은 시작일 이후여야 합니다");

    setError(null);
    startTransition(async () => {
      const result = await createMeeting({
        title: title.trim(),
        dateRangeStart: startDate,
        dateRangeEnd: endDate,
        participants: filled,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">약속 만들기</h1>
          <p className="text-sm text-gray-500">
            제목, 날짜 범위, 참여자를 입력해주세요
          </p>
        </header>

        <form action={() => handleSubmit()} className="space-y-6">
          <Field label="제목">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 12월 커플 모임"
              maxLength={50}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-gray-400"
            />
          </Field>

          <Field label="시작일">
            <DateSelect
              value={startDate}
              onChange={setStartDate}
              minYear={MIN_YEAR}
              maxYear={MAX_YEAR}
            />
          </Field>

          <Field label="종료일">
            <DateSelect
              value={endDate}
              onChange={setEndDate}
              minYear={MIN_YEAR}
              maxYear={MAX_YEAR}
            />
          </Field>

          <Field
            label="참여자"
            rightSlot={
              <span className="text-xs text-gray-400">
                {participants.length}/{MAX_PARTICIPANTS}
              </span>
            }
          >
            <div className="space-y-2">
              {participants.map((p, index) => (
                <div key={p.id} className="flex gap-2">
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => updateParticipant(p.id, e.target.value)}
                    placeholder={`참여자 ${index + 1}`}
                    maxLength={20}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-gray-400"
                  />
                  {participants.length > MIN_PARTICIPANTS && (
                    <button
                      type="button"
                      onClick={() => removeParticipant(p.id)}
                      aria-label="참여자 삭제"
                      className="rounded-xl border border-gray-200 px-3 text-gray-400 transition hover:border-red-200 hover:text-red-500"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {participants.length < MAX_PARTICIPANTS && (
              <button
                type="button"
                onClick={addParticipant}
                className="mt-2 w-full rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
              >
                + 참여자 추가
              </button>
            )}
          </Field>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="block w-full rounded-2xl bg-gray-900 px-6 py-4 text-base font-medium text-white transition hover:bg-gray-800 active:bg-gray-700 disabled:opacity-50"
          >
            {isPending ? "생성 중..." : "약속 만들기"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
  rightSlot,
}: {
  label: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {rightSlot}
      </div>
      {children}
    </div>
  );
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function DateSelect({
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

type PickerOption = { value: number; label: string };

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

  // 펼칠 때 선택된 옵션으로 스크롤
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
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 outline-none transition focus:border-gray-400"
      >
        <span>{selected?.label}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`h-4 w-4 text-gray-400 transition-transform ${
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
          className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
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
                      ? "block w-full bg-gray-900 px-3 py-2.5 text-left text-base font-medium text-white"
                      : "block w-full px-3 py-2.5 text-left text-base text-gray-700 transition hover:bg-gray-50"
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
