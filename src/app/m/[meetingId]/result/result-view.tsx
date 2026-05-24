"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useOptimistic,
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
import {
  PrimaryFooterLink,
  StickyFooter,
} from "@/components/layout/sticky-footer";
import { Calendar } from "@/components/calendar/calendar";
import { CopyShareLink } from "./copy-share-link";
import { HostActionsMenu } from "./host-actions-menu";
import { confirmMeeting, toggleAvailability } from "./actions";

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

type ToggleAction = { type: "toggle"; date: string };

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [isConfirming, startConfirming] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
  const [inputMode, setInputMode] = useState(
    !!currentParticipantId && !initialConfirmedDate && myInitialAvailCount === 0,
  );

  function switchMode(next: boolean) {
    setInputMode(next);
    setSelectedDate(null);
  }

  const [availabilities, applyOptimistic] = useOptimistic(
    baseAvailabilities,
    (state, action: ToggleAction) => {
      if (!currentParticipantId) return state;
      const exists = state.some(
        (a) =>
          a.participant_id === currentParticipantId &&
          a.available_date === action.date,
      );
      if (exists) {
        return state.filter(
          (a) =>
            !(
              a.participant_id === currentParticipantId &&
              a.available_date === action.date
            ),
        );
      }
      return [
        ...state,
        {
          participant_id: currentParticipantId,
          available_date: action.date,
        },
      ];
    },
  );

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

  function handleToggle(date: string) {
    if (!currentParticipantId) return;
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "toggle", date });
      const result = await toggleAvailability({
        meetingId,
        participantId: currentParticipantId,
        date,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      // realtime이 늦거나 못 받아도 일관성을 유지하기 위해 base를 직접 갱신
      setBaseAvailabilities((prev) => {
        const exists = prev.some(
          (a) =>
            a.participant_id === currentParticipantId &&
            a.available_date === date,
        );
        if (exists) {
          return prev.filter(
            (a) =>
              !(
                a.participant_id === currentParticipantId &&
                a.available_date === date
              ),
          );
        }
        return [
          ...prev,
          { participant_id: currentParticipantId, available_date: date },
        ];
      });
    });
  }

  function handleSelectDate(date: string) {
    setSelectedDate((prev) => (prev === date ? null : date));
  }

  function handleConfirm() {
    if (!selectedDate) return;
    startConfirming(async () => {
      await confirmMeeting({ meetingId, date: selectedDate });
    });
  }

  const selectedAvailSet = new Set(
    selectedDate
      ? availabilities
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
          back={{ fallbackHref: "/" }}
          error={error}
          primary={footerPrimary}
        />
      }
    >
      <div className="mx-auto w-full max-w-md space-y-5 px-4 py-4">
        {canSwitchMode ? (
          <ModeSegmented inputMode={inputMode} onChange={switchMode} />
        ) : null}

        <Calendar
          dateRangeStart={dateRangeStart}
          dateRangeEnd={dateRangeEnd}
          participants={participants}
          availabilities={availabilities}
          selectedDate={selectedDate}
          onSelectDate={inputMode ? noop : handleSelectDate}
          currentParticipantId={currentParticipantId ?? undefined}
          onToggleDate={
            currentParticipantId && inputMode ? handleToggle : undefined
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
          onConfirm={handleConfirm}
          onClose={() => setSelectedDate(null)}
        />

        <ParticipantChips
          participants={participants}
          currentParticipantId={currentParticipantId}
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
  const baseClass = "flex-1 rounded-full px-4 py-2 text-sm transition";
  const activeClass = "bg-canvas font-bold text-ink-deep shadow-sm";
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
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="flex w-full items-center justify-center rounded-full bg-ink-deep px-6 py-4 text-base font-bold text-canvas transition active:bg-charcoal disabled:opacity-50"
          >
            {isConfirming ? "확정 중..." : "이 날로 약속 확정하기"}
          </button>
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
}: {
  participants: Participant[];
  currentParticipantId: string | null;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium text-stone">
        참여자 ({participants.length}명)
      </h3>
      <ul className="flex flex-wrap gap-1.5">
        {participants.map((p) => {
          const isMe = p.id === currentParticipantId;
          const isJoined = !!p.color;
          const className = isJoined
            ? isMe
              ? "flex items-center gap-1.5 rounded-full border-2 border-ink-deep bg-canvas px-3 py-1.5 text-sm font-bold text-ink-deep"
              : "flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-1.5 text-sm text-ink-deep"
            : "flex items-center gap-1.5 rounded-full border border-dashed border-hairline-soft px-3 py-1.5 text-sm text-stone";
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
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
