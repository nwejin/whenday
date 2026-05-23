"use client";

import { useRef, useState, useTransition } from "react";
import { addDays, format } from "date-fns";
import { Plus, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  PrimaryFooterButton,
  StickyFooter,
} from "@/components/layout/sticky-footer";
import { DatePicker } from "@/components/date-picker/date-picker";
import { createMeeting } from "./actions";
import { AddParticipantDialog } from "./add-participant-dialog";
import { HostColorSheet } from "./host-color-sheet";

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
  const [hostName, setHostName] = useState("");
  const [hostColor, setHostColor] = useState<string | null>(null);
  const [colorSheetOpen, setColorSheetOpen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const nextIdRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalCount = 1 + participants.length;
  const canAddMore = totalCount < MAX_PARTICIPANTS;
  const existingNames = [hostName.trim(), ...participants.map((p) => p.name)]
    .filter(Boolean);

  function addParticipant(name: string) {
    setParticipants((prev) => {
      if (1 + prev.length >= MAX_PARTICIPANTS) return prev;
      const id = `p-${nextIdRef.current++}`;
      return [...prev, { id, name }];
    });
  }

  function removeParticipant(id: string) {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }

  function handleSubmit() {
    const trimmedHost = hostName.trim();
    if (!trimmedHost) return setError("방장 이름을 입력해주세요");
    if (!hostColor) return setError("방장 색을 선택해주세요");

    const names = [trimmedHost, ...participants.map((p) => p.name.trim())]
      .filter(Boolean);

    if (!title.trim()) return setError("제목을 입력해주세요");
    if (names.length < MIN_PARTICIPANTS)
      return setError(`참여자는 최소 ${MIN_PARTICIPANTS}명이어야 합니다`);
    if (new Set(names).size !== names.length)
      return setError("참여자 이름이 중복됩니다");
    if (startDate > endDate)
      return setError("종료일은 시작일 이후여야 합니다");

    setError(null);
    startTransition(async () => {
      const result = await createMeeting({
        title: title.trim(),
        dateRangeStart: startDate,
        dateRangeEnd: endDate,
        participants: names,
        hostColor,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <AppShell
        header={
          <PageHeader
            title="약속 만들기"
            subtitle="제목, 날짜, 참여자를 입력해주세요"
          />
        }
        footer={
          <StickyFooter
            error={error}
            back={{ fallbackHref: "/" }}
            primary={
              <PrimaryFooterButton
                type="submit"
                form="new-meeting-form"
                disabled={isPending}
              >
                {isPending ? "생성 중..." : "약속 만들기"}
              </PrimaryFooterButton>
            }
          />
        }
      >
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
                {totalCount}/{MAX_PARTICIPANTS}
              </span>
            }
          >
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="방장 이름"
                  maxLength={20}
                  className="w-full rounded-xl border border-hairline-soft bg-canvas px-4 py-3 pr-24 text-base text-ink-deep outline-none transition focus:border-ink-deep"
                />
                <button
                  type="button"
                  onClick={() => setColorSheetOpen(true)}
                  aria-label={hostColor ? "방장 색 변경" : "방장 색 선택"}
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full border border-hairline bg-canvas py-1 pl-1.5 pr-2.5 text-[11px] font-bold text-ink-deep transition active:bg-surface-soft"
                >
                  {hostColor ? (
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: hostColor }}
                      aria-hidden
                    />
                  ) : (
                    <span
                      className="h-4 w-4 rounded-full border border-dashed border-hairline"
                      aria-hidden
                    />
                  )}
                  <span>방장</span>
                </button>
              </div>

              {participants.length > 0 ? (
                <ul className="flex flex-wrap gap-2 pt-1">
                  {participants.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-1.5 rounded-full border border-hairline bg-canvas py-1.5 pl-3 pr-1.5 text-sm text-ink-deep"
                    >
                      <span className="max-w-40 truncate">{p.name}</span>
                      <button
                        type="button"
                        onClick={() => removeParticipant(p.id)}
                        aria-label={`${p.name} 삭제`}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-soft text-charcoal transition active:bg-critical/15 active:text-critical"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {canAddMore ? (
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-hairline-soft px-4 py-3 text-sm text-slate transition active:border-hairline active:text-ink-deep"
                >
                  <Plus className="h-4 w-4" />
                  <span>참여자 추가</span>
                </button>
              ) : (
                <p className="pt-1 text-center text-xs text-stone">
                  최대 {MAX_PARTICIPANTS}명까지 추가할 수 있어요
                </p>
              )}
            </div>
          </Field>
        </form>
      </AppShell>

      <AddParticipantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={addParticipant}
        existingNames={existingNames}
      />

      <HostColorSheet
        open={colorSheetOpen}
        onOpenChange={setColorSheetOpen}
        selected={hostColor}
        onSelect={setHostColor}
      />
    </>
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
