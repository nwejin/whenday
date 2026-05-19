"use client";

import { useRef, useState, useTransition } from "react";
import { addDays, format } from "date-fns";
import { DatePicker } from "@/components/date-picker/date-picker";
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
    <main className="flex h-dvh flex-col bg-canvas">
      <header className="shrink-0 border-b border-hairline-soft bg-canvas">
        <div className="mx-auto w-full max-w-md px-4 py-5 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-ink-deep">
            약속 만들기
          </h1>
          <p className="mt-1 text-sm text-slate">
            제목, 날짜 범위, 참여자를 입력해주세요
          </p>
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto">
        <form
          id="new-meeting-form"
          action={() => handleSubmit()}
          className="mx-auto w-full max-w-md space-y-6 px-4 py-6"
        >
          <Field label="제목">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 12월 커플 모임"
              maxLength={50}
              className="w-full rounded-xl border border-hairline-soft bg-canvas px-4 py-3 text-base text-ink-deep outline-none transition focus:border-ink-deep"
            />
          </Field>

          <Field label="시작일">
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              minYear={MIN_YEAR}
              maxYear={MAX_YEAR}
            />
          </Field>

          <Field label="종료일">
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              minYear={MIN_YEAR}
              maxYear={MAX_YEAR}
            />
          </Field>

          <Field
            label="참여자"
            rightSlot={
              <span className="text-xs text-stone">
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
                    className="flex-1 rounded-xl border border-hairline-soft bg-canvas px-4 py-3 text-base text-ink-deep outline-none transition focus:border-ink-deep"
                  />
                  {participants.length > MIN_PARTICIPANTS && (
                    <button
                      type="button"
                      onClick={() => removeParticipant(p.id)}
                      aria-label="참여자 삭제"
                      className="rounded-xl border border-hairline-soft px-3 text-stone transition active:border-critical/30 active:text-critical"
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
                className="mt-2 w-full rounded-xl border border-dashed border-hairline-soft px-4 py-3 text-sm text-slate transition active:border-hairline active:text-ink-deep"
              >
                + 참여자 추가
              </button>
            )}
          </Field>
        </form>
      </section>

      <footer className="shrink-0 border-t border-hairline-soft bg-canvas">
        <div
          className="mx-auto w-full max-w-md px-4 pt-4"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
        >
          {error && (
            <p className="mb-3 rounded-xl bg-critical/10 px-3 py-2 text-sm text-critical">
              {error}
            </p>
          )}
          <button
            type="submit"
            form="new-meeting-form"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-deep px-6 py-4 text-base font-bold text-canvas transition active:bg-charcoal disabled:opacity-40"
          >
            {isPending ? "생성 중..." : "약속 만들기"}
          </button>
        </div>
      </footer>
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
        <label className="text-sm font-medium text-charcoal">{label}</label>
        {rightSlot}
      </div>
      {children}
    </div>
  );
}
