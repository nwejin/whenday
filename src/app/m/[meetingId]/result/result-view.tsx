"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { AppShell } from "@/components/layout/app-shell";
import { Dialog } from "@/components/ui/dialog";
import { useMeetingRealtime } from "@/hooks/use-meeting-realtime";
import { useConfirm } from "@/hooks/use-confirm";
import {
  PrimaryFooterButton,
  PrimaryFooterLink,
  StickyFooter,
} from "@/components/layout/sticky-footer";
import { Calendar } from "@/components/calendar/calendar";
import { CopyShareLink } from "./copy-share-link";
import { HostActionsMenu } from "./host-actions-menu";
import { confirmMeeting, saveMyAvailabilities } from "./actions";

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

function noop() {}

export function ResultView({
  meetingId,
  title,
  dateRangeStart,
  dateRangeEnd,
  isHost,
  confirmedDate: initialConfirmedDate,
  participants: initialParticipants,
  availabilities: initialAvailabilities,
  currentParticipantId,
  shareUrl,
}: {
  meetingId: string;
  title: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  isHost: boolean;
  confirmedDate: string | null;
  participants: Participant[];
  availabilities: Availability[];
  currentParticipantId: string | null;
  shareUrl: string;
}) {
  const { confirm, confirmDialog } = useConfirm();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isConfirming, startConfirming] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [participants, setParticipants] =
    useState<Participant[]>(initialParticipants);
  const [baseAvailabilities, setBaseAvailabilities] =
    useState<Availability[]>(initialAvailabilities);
  const [confirmedDate, setConfirmedDate] = useState<string | null>(
    initialConfirmedDate,
  );

  const participantsRef = useRef(participants);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const myInitialAvailCount = currentParticipantId
    ? initialAvailabilities.filter(
        (a) => a.participant_id === currentParticipantId,
      ).length
    : 0;
  const canSwitchMode = !!currentParticipantId && !confirmedDate;
  const initialInputMode =
    !!currentParticipantId && !initialConfirmedDate && myInitialAvailCount === 0;
  const [inputMode, setInputMode] = useState(initialInputMode);

  // 입력 모드일 때만 채워지는 본인 draft. 셀 탭/드래그는 이 set만 변경.
  const [inputDraft, setInputDraft] = useState<Set<string> | null>(() =>
    initialInputMode ? new Set<string>() : null,
  );

  const myBaseSet = useMemo(() => {
    if (!currentParticipantId) return new Set<string>();
    const s = new Set<string>();
    for (const a of baseAvailabilities) {
      if (a.participant_id === currentParticipantId) s.add(a.available_date);
    }
    return s;
  }, [baseAvailabilities, currentParticipantId]);

  const isDirty = useMemo(() => {
    if (!inputDraft) return false;
    if (inputDraft.size !== myBaseSet.size) return true;
    for (const d of inputDraft) if (!myBaseSet.has(d)) return true;
    return false;
  }, [inputDraft, myBaseSet]);

  async function switchMode(next: boolean) {
    if (next === inputMode) return;
    if (next) {
      setInputDraft(new Set(myBaseSet));
      setInputMode(true);
      setSelectedDate(null);
      return;
    }
    if (isDirty) {
      const ok = await confirm({
        title: "결과 보기로 갈까요?",
        message: "저장하지 않은 변경사항이 사라져요.",
        confirmLabel: "결과 보기",
      });
      if (!ok) return;
    }
    setInputDraft(null);
    setInputMode(false);
    setSelectedDate(null);
  }

  function guardLeave(): boolean | Promise<boolean> {
    if (inputMode && isDirty) {
      return confirm({
        title: "이 페이지를 나갈까요?",
        message: "저장하지 않은 변경사항이 사라져요.",
        confirmLabel: "나가기",
      });
    }
    return true;
  }

  const currentParticipant = participants.find(
    (p) => p.id === currentParticipantId,
  );

  const handleParticipantChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Participant>) => {
      if (payload.eventType === "INSERT") {
        const row = payload.new;
        setParticipants((prev) => {
          if (prev.some((p) => p.id === row.id)) return prev;
          const next = [...prev, row];
          next.sort((a, b) => a.display_order - b.display_order);
          return next;
        });
      } else if (payload.eventType === "UPDATE") {
        const row = payload.new;
        setParticipants((prev) =>
          prev.map((p) => (p.id === row.id ? { ...p, ...row } : p)),
        );
      } else if (payload.eventType === "DELETE") {
        const oldId = (payload.old as { id?: string }).id;
        if (!oldId) return;
        setParticipants((prev) => prev.filter((p) => p.id !== oldId));
        setBaseAvailabilities((prev) =>
          prev.filter((a) => a.participant_id !== oldId),
        );
      }
    },
    [],
  );

  const handleAvailabilityChange = useCallback(
    (
      payload: RealtimePostgresChangesPayload<{
        id: string;
        participant_id: string;
        available_date: string;
      }>,
    ) => {
      if (payload.eventType === "INSERT") {
        const row = payload.new;
        if (!row.participant_id || !row.available_date) return;
        if (!participantsRef.current.some((p) => p.id === row.participant_id))
          return;
        setBaseAvailabilities((prev) => {
          if (
            prev.some(
              (a) =>
                a.participant_id === row.participant_id &&
                a.available_date === row.available_date,
            )
          )
            return prev;
          return [
            ...prev,
            {
              participant_id: row.participant_id,
              available_date: row.available_date,
            },
          ];
        });
      } else if (payload.eventType === "DELETE") {
        const row = payload.old as {
          participant_id?: string;
          available_date?: string;
        };
        if (!row.participant_id || !row.available_date) return;
        setBaseAvailabilities((prev) =>
          prev.filter(
            (a) =>
              !(
                a.participant_id === row.participant_id &&
                a.available_date === row.available_date
              ),
          ),
        );
      }
    },
    [],
  );

  const handleMeetingChange = useCallback(
    (
      payload: RealtimePostgresChangesPayload<{
        id: string;
        confirmed_date: string | null;
      }>,
    ) => {
      if (payload.eventType === "UPDATE") {
        setConfirmedDate(payload.new.confirmed_date ?? null);
      }
    },
    [],
  );

  useMeetingRealtime(meetingId, {
    onParticipantChange: handleParticipantChange,
    onAvailabilityChange: handleAvailabilityChange,
    onMeetingChange: handleMeetingChange,
  });

  function handleToggleDraft(date: string) {
    setInputDraft((prev) => {
      if (!prev) return prev;
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  function handleSave() {
    if (!currentParticipantId || !inputDraft) return;
    if (!isDirty) {
      // 변경 없음 — 그냥 결과 모드로
      setInputDraft(null);
      setInputMode(false);
      setSelectedDate(null);
      return;
    }
    setError(null);
    const dates = Array.from(inputDraft);
    startSaving(async () => {
      const result = await saveMyAvailabilities({
        meetingId,
        participantId: currentParticipantId,
        dates,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setBaseAvailabilities((prev) => {
        const others = prev.filter(
          (a) => a.participant_id !== currentParticipantId,
        );
        const mine: Availability[] = dates.map((date) => ({
          participant_id: currentParticipantId,
          available_date: date,
        }));
        return [...others, ...mine];
      });
      setInputDraft(null);
      setInputMode(false);
      setSelectedDate(null);
    });
  }

  function handleSelectDate(date: string) {
    setSelectedDate((prev) => (prev === date ? null : date));
  }

  function handleConfirm() {
    if (!selectedDate) return;
    setConfirmError(null);
    startConfirming(async () => {
      const result = await confirmMeeting({ meetingId, date: selectedDate });
      if (result?.error) {
        setConfirmError(result.error);
      }
    });
  }

  const displayedAvailabilities = useMemo<Availability[]>(() => {
    if (!inputMode || !inputDraft || !currentParticipantId) {
      return baseAvailabilities;
    }
    const others = baseAvailabilities.filter(
      (a) => a.participant_id !== currentParticipantId,
    );
    const mine: Availability[] = [];
    for (const date of inputDraft) {
      mine.push({
        participant_id: currentParticipantId,
        available_date: date,
      });
    }
    return [...others, ...mine];
  }, [inputMode, inputDraft, baseAvailabilities, currentParticipantId]);

  const allAvailableCount = useMemo(() => {
    if (participants.length === 0) return 0;
    const byDate = new Map<string, Set<string>>();
    for (const a of baseAvailabilities) {
      let set = byDate.get(a.available_date);
      if (!set) {
        set = new Set();
        byDate.set(a.available_date, set);
      }
      set.add(a.participant_id);
    }
    let count = 0;
    for (const set of byDate.values()) {
      if (participants.every((p) => set.has(p.id))) count++;
    }
    return count;
  }, [baseAvailabilities, participants]);

  // 가용시간을 1개 이상 저장한 참여자 = 입력 완료로 간주.
  const submittedIds = useMemo(() => {
    const s = new Set<string>();
    for (const a of baseAvailabilities) s.add(a.participant_id);
    return s;
  }, [baseAvailabilities]);

  const selectedAvailSet = new Set(
    selectedDate
      ? baseAvailabilities
          .filter((a) => a.available_date === selectedDate)
          .map((a) => a.participant_id)
      : [],
  );
  const allAvailableOnSelected =
    !!selectedDate &&
    participants.length > 0 &&
    participants.every((p) => selectedAvailSet.has(p.id));

  let footerPrimary: ReactNode = null;
  if (confirmedDate) {
    footerPrimary = (
      <PrimaryFooterLink href={`/m/${meetingId}/confirmed`}>
        확정된 날짜 보기
      </PrimaryFooterLink>
    );
  } else if (!currentParticipant) {
    footerPrimary = (
      <PrimaryFooterLink href={`/m/${meetingId}`}>
        본인 이름·색 고르기
      </PrimaryFooterLink>
    );
  } else if (inputMode) {
    footerPrimary = (
      <PrimaryFooterButton
        type="button"
        onClick={handleSave}
        disabled={isSaving || !isDirty}
      >
        {isSaving ? "저장 중..." : "저장하기"}
      </PrimaryFooterButton>
    );
  } else {
    footerPrimary = (
      <PrimaryFooterButton type="button" onClick={() => switchMode(true)}>
        수정하기
      </PrimaryFooterButton>
    );
  }

  return (
    <AppShell
      header={
        <ResultHeader
          meetingId={meetingId}
          title={title}
          dateRangeStart={dateRangeStart}
          dateRangeEnd={dateRangeEnd}
          currentParticipant={currentParticipant ?? null}
          isHost={isHost}
          isConfirmed={!!confirmedDate}
          shareUrl={shareUrl}
          onUnconfirmed={() => setConfirmedDate(null)}
        />
      }
      footer={
        <StickyFooter
          back={{ fallbackHref: "/", onBeforeNavigate: guardLeave }}
          error={error}
          primary={footerPrimary}
        />
      }
    >
      <div className="mx-auto w-full max-w-md space-y-5 px-4 py-4">
        {canSwitchMode ? (
          <ModeSegmented inputMode={inputMode} onChange={switchMode} />
        ) : null}

        {!inputMode && baseAvailabilities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hairline-soft bg-surface-soft px-4 py-5 text-center">
            <p className="text-sm font-medium text-charcoal">
              아직 아무도 가능한 날짜를 입력하지 않았어요
            </p>
            <p className="mt-1 text-xs text-stone">
              링크를 공유해 참여자에게 입력을 요청해보세요
            </p>
          </div>
        ) : null}

        {!inputMode && !confirmedDate && allAvailableCount > 0 ? (
          <div className="rounded-2xl border border-hairline-soft bg-surface-soft px-4 py-3 text-center">
            <p className="text-sm font-medium text-ink-deep">
              ⭐ 전원 가능한 날이 {allAvailableCount}일 있어요
            </p>
            {isHost ? (
              <p className="mt-0.5 text-xs text-slate">
                날짜를 눌러 약속을 확정하세요
              </p>
            ) : null}
          </div>
        ) : null}

        <Calendar
          dateRangeStart={dateRangeStart}
          dateRangeEnd={dateRangeEnd}
          participants={participants}
          availabilities={displayedAvailabilities}
          selectedDate={selectedDate}
          onSelectDate={inputMode ? noop : handleSelectDate}
          currentParticipantId={currentParticipantId ?? undefined}
          onToggleDate={
            currentParticipantId && inputMode ? handleToggleDraft : undefined
          }
          confirmedDate={confirmedDate}
        />

        <SelectedDateSheet
          open={!inputMode && !!selectedDate}
          date={selectedDate}
          participants={participants}
          availSet={selectedAvailSet}
          isHost={isHost && !confirmedDate}
          isAllAvailable={allAvailableOnSelected}
          isConfirming={isConfirming}
          error={confirmError}
          onConfirm={handleConfirm}
          onClose={() => {
            setSelectedDate(null);
            setConfirmError(null);
          }}
        />

        {confirmDialog}

        <ParticipantChips
          participants={participants}
          currentParticipantId={currentParticipantId}
          submittedIds={submittedIds}
          isHost={isHost}
        />

        {canSwitchMode && inputMode ? (
          <p className="text-center text-sm text-stone">
            셀을 탭하거나 드래그해서 가능한 날짜를 골라요
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}

function ResultHeader({
  meetingId,
  title,
  dateRangeStart,
  dateRangeEnd,
  currentParticipant,
  isHost,
  isConfirmed,
  shareUrl,
  onUnconfirmed,
}: {
  meetingId: string;
  title: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  currentParticipant: Participant | null;
  isHost: boolean;
  isConfirmed: boolean;
  shareUrl: string;
  onUnconfirmed: () => void;
}) {
  const rangeLabel = `${format(parseISO(dateRangeStart), "M.d")} ~ ${format(parseISO(dateRangeEnd), "M.d")}`;
  return (
    <header className="shrink-0 border-b border-hairline-soft bg-canvas">
      <div className="mx-auto w-full max-w-md px-4 py-3">
        <h1 className="truncate text-lg font-bold tracking-tight text-ink-deep">
          {title}
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <p className="flex-1 truncate text-sm text-slate">{rangeLabel}</p>
          {currentParticipant ? (
            <span className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-surface-soft px-3 text-sm font-medium text-ink-deep">
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor:
                    currentParticipant.color ?? "var(--color-stone)",
                }}
                aria-hidden
              />
              <span className="max-w-24 truncate">
                {currentParticipant.name}
              </span>
              {isHost ? (
                <span className="text-xs text-slate">(방장)</span>
              ) : null}
            </span>
          ) : null}
          <CopyShareLink url={shareUrl} />
          {isHost ? (
            <HostActionsMenu
              meetingId={meetingId}
              isConfirmed={isConfirmed}
              onUnconfirmed={onUnconfirmed}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}

function ModeSegmented({
  inputMode,
  onChange,
}: {
  inputMode: boolean;
  onChange: (next: boolean) => void;
}) {
  const baseClass = "flex-1 rounded-full px-4 py-2.5 text-sm transition";
  const activeClass = "bg-ink-deep font-bold text-canvas shadow-sm";
  const inactiveClass = "text-charcoal active:text-ink-deep";
  return (
    <div
      role="tablist"
      aria-label="캘린더 모드"
      className="flex rounded-full bg-surface-soft p-1"
    >
      <button
        type="button"
        role="tab"
        aria-selected={inputMode}
        onClick={() => onChange(true)}
        className={`${baseClass} ${inputMode ? activeClass : inactiveClass}`}
      >
        내 일정 입력
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={!inputMode}
        onClick={() => onChange(false)}
        className={`${baseClass} ${!inputMode ? activeClass : inactiveClass}`}
      >
        결과 보기
      </button>
    </div>
  );
}

function SelectedDateSheet({
  open,
  date,
  participants,
  availSet,
  isHost,
  isAllAvailable,
  isConfirming,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  date: string | null;
  participants: Participant[];
  availSet: Set<string>;
  isHost: boolean;
  isAllAvailable: boolean;
  isConfirming: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const label = date
    ? format(parseISO(date), "M월 d일 EEEE", { locale: ko })
    : "";
  const availCount = participants.filter((p) => availSet.has(p.id)).length;

  const availList = participants.filter((p) => availSet.has(p.id));
  const unavailList = participants.filter(
    (p) => !availSet.has(p.id) && p.color,
  );
  const noJoinList = participants.filter((p) => !p.color);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={
        <span>
          {label}
          {isAllAvailable ? <span className="ml-1 text-base">⭐</span> : null}
        </span>
      }
      description={`${availCount} / ${participants.length}명 가능`}
      footer={
        isHost && isAllAvailable ? (
          <div>
            {error ? (
              <p className="mb-3 rounded-xl bg-critical/10 px-3 py-2 text-sm text-critical">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              onClick={onConfirm}
              disabled={isConfirming}
              className="flex w-full items-center justify-center rounded-full bg-ink-deep px-6 py-4 text-base font-bold text-canvas transition active:bg-charcoal disabled:opacity-50"
            >
              {isConfirming ? "확정 중..." : "이 날로 약속 확정하기"}
            </button>
          </div>
        ) : null
      }
    >
      <div className="space-y-3 pb-3">
        {availList.length > 0 ? (
          <ChipRow label="가능" participants={availList} variant="filled" />
        ) : null}
        {unavailList.length > 0 ? (
          <ChipRow label="불가능" participants={unavailList} variant="muted" />
        ) : null}
        {noJoinList.length > 0 ? (
          <ChipRow label="미입장" participants={noJoinList} variant="ghost" />
        ) : null}
      </div>
    </Dialog>
  );
}

function ChipRow({
  label,
  participants,
  variant,
}: {
  label: string;
  participants: Participant[];
  variant: "filled" | "muted" | "ghost";
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold tracking-wide text-stone">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {participants.map((p) => (
          <ParticipantNameChip key={p.id} participant={p} variant={variant} />
        ))}
      </div>
    </div>
  );
}

function ParticipantNameChip({
  participant,
  variant,
}: {
  participant: Participant;
  variant: "filled" | "muted" | "ghost";
}) {
  const className =
    variant === "filled"
      ? "flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-1.5 text-sm font-medium text-ink-deep"
      : variant === "muted"
        ? "flex items-center gap-1.5 rounded-full border border-hairline-soft bg-surface-soft px-3 py-1.5 text-sm text-stone line-through"
        : "flex items-center gap-1.5 rounded-full border border-dashed border-hairline-soft px-3 py-1.5 text-sm text-stone";
  return (
    <span className={className}>
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{
          backgroundColor: participant.color ?? "var(--color-stone)",
        }}
        aria-hidden
      />
      {participant.name}
    </span>
  );
}

function ParticipantChips({
  participants,
  currentParticipantId,
  submittedIds,
  isHost,
}: {
  participants: Participant[];
  currentParticipantId: string | null;
  submittedIds: Set<string>;
  isHost: boolean;
}) {
  const total = participants.length;
  const submittedCount = participants.filter((p) => submittedIds.has(p.id))
    .length;

  // 입장은 했지만(색 선택) 아직 입력하지 않은 사람 = 리마인드 대상.
  const pending = participants.filter(
    (p) => !!p.color && !submittedIds.has(p.id),
  );
  const pendingHint = buildPendingHint(pending);

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-stone">참여자 {total}명</h3>
        <span className="shrink-0 text-sm font-medium text-charcoal">
          입력 {submittedCount}/{total}
        </span>
      </div>
      {isHost && pendingHint ? (
        <p className="text-xs text-slate">{pendingHint} 아직 입력 전이에요</p>
      ) : null}
      <ul className="flex flex-wrap gap-1.5">
        {participants.map((p) => {
          const isMe = p.id === currentParticipantId;
          const isJoined = !!p.color;
          const hasSubmitted = submittedIds.has(p.id);
          const className = !isJoined
            ? "flex items-center gap-1.5 rounded-full border border-dashed border-hairline-soft px-3 py-1.5 text-sm text-stone"
            : !hasSubmitted
              ? "flex items-center gap-1.5 rounded-full border border-hairline-soft bg-surface-soft px-3 py-1.5 text-sm text-slate"
              : isMe
                ? "flex items-center gap-1.5 rounded-full border-2 border-ink-deep bg-canvas px-3 py-1.5 text-sm font-bold text-ink-deep"
                : "flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-1.5 text-sm text-ink-deep";
          return (
            <li key={p.id}>
              <span className={className}>
                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: p.color ?? "var(--color-stone)",
                  }}
                  aria-hidden
                />
                {p.name}
                {isMe ? <span className="text-xs">나</span> : null}
                {isJoined && !hasSubmitted ? (
                  <span className="text-xs text-stone">입력 전</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function buildPendingHint(pending: Participant[]): string | null {
  if (pending.length === 0) return null;
  const names = pending.map((p) => p.name);
  if (names.length <= 2) return names.join("·");
  return `${names.slice(0, 2).join("·")} 외 ${names.length - 2}명`;
}
