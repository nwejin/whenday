"use client";

import { ReactNode, useOptimistic, useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import {
  PrimaryFooterButton,
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

export function ResultView({
  meetingId,
  title,
  dateRangeStart,
  dateRangeEnd,
  isHost,
  confirmedDate,
  participants,
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

  const [availabilities, applyOptimistic] = useOptimistic(
    initialAvailabilities,
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

  function handleToggle(date: string) {
    if (!currentParticipantId) return;
    startTransition(async () => {
      applyOptimistic({ type: "toggle", date });
      await toggleAvailability({
        meetingId,
        participantId: currentParticipantId,
        date,
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
  } else if (isHost) {
    footerPrimary = (
      <PrimaryFooterButton
        type="button"
        onClick={handleConfirm}
        disabled={!allAvailableOnSelected || isConfirming}
      >
        {isConfirming
          ? "확정 중..."
          : !selectedDate
            ? "날짜를 선택해주세요"
            : !allAvailableOnSelected
              ? "모두 가능해야 확정 가능"
              : "이 날로 확정"}
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
        />
      }
      footer={
        <StickyFooter back={{ fallbackHref: "/" }} primary={footerPrimary} />
      }
    >
      <div className="mx-auto w-full max-w-md space-y-5 px-4 py-4">
        <Calendar
          dateRangeStart={dateRangeStart}
          dateRangeEnd={dateRangeEnd}
          participants={participants}
          availabilities={availabilities}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          currentParticipantId={currentParticipantId ?? undefined}
          onToggleDate={currentParticipantId ? handleToggle : undefined}
        />

        {selectedDate ? (
          <SelectedDatePanel
            date={selectedDate}
            participants={participants}
            availSet={selectedAvailSet}
            onClose={() => setSelectedDate(null)}
          />
        ) : null}

        <ParticipantChips
          participants={participants}
          currentParticipantId={currentParticipantId}
        />

        {!confirmedDate && currentParticipantId ? (
          <p className="text-center text-xs text-stone">
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
}: {
  meetingId: string;
  title: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  currentParticipant: Participant | null;
  isHost: boolean;
  isConfirmed: boolean;
  shareUrl: string;
}) {
  const rangeLabel = `${format(parseISO(dateRangeStart), "M.d")} ~ ${format(parseISO(dateRangeEnd), "M.d")}`;
  return (
    <header className="shrink-0 border-b border-hairline-soft bg-canvas">
      <div className="mx-auto w-full max-w-md px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="flex-1 truncate text-lg font-bold tracking-tight text-ink-deep">
            {title}
          </h1>
          {currentParticipant ? (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface-soft px-2.5 py-1 text-xs font-medium text-ink-deep">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    currentParticipant.color ?? "var(--color-stone)",
                }}
                aria-hidden
              />
              <span>{currentParticipant.name}</span>
              {isHost ? (
                <span className="text-[10px] text-slate">(방장)</span>
              ) : null}
            </span>
          ) : null}
          <CopyShareLink url={shareUrl} />
          {isHost ? (
            <HostActionsMenu
              meetingId={meetingId}
              isConfirmed={isConfirmed}
            />
          ) : null}
        </div>
        <p className="mt-1 text-xs text-slate">{rangeLabel}</p>
      </div>
    </header>
  );
}

function SelectedDatePanel({
  date,
  participants,
  availSet,
  onClose,
}: {
  date: string;
  participants: Participant[];
  availSet: Set<string>;
  onClose: () => void;
}) {
  const label = format(parseISO(date), "M월 d일 EEEE", { locale: ko });
  const totalJoined = participants.filter((p) => p.color).length;
  const availCount = participants.filter((p) => availSet.has(p.id)).length;
  const allAvailable =
    totalJoined > 0 &&
    participants.length === totalJoined &&
    availCount === participants.length;

  const availList = participants.filter((p) => availSet.has(p.id));
  const unavailList = participants.filter(
    (p) => !availSet.has(p.id) && p.color,
  );
  const noJoinList = participants.filter((p) => !p.color);

  return (
    <div className="space-y-3 rounded-2xl border border-hairline bg-canvas p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-bold text-ink-deep">
            {label}
            {allAvailable ? (
              <span className="ml-1 text-sm">⭐</span>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs text-slate">
            {availCount} / {participants.length}명 가능
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone transition active:bg-surface-soft"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

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
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold tracking-wide text-stone">{label}</p>
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
      ? "flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-2.5 py-1 text-xs font-medium text-ink-deep"
      : variant === "muted"
        ? "flex items-center gap-1.5 rounded-full border border-hairline-soft bg-surface-soft px-2.5 py-1 text-xs text-stone line-through"
        : "flex items-center gap-1.5 rounded-full border border-dashed border-hairline-soft px-2.5 py-1 text-xs text-stone";
  return (
    <span className={className}>
      <span
        className="h-2 w-2 rounded-full"
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
      <h3 className="text-xs font-medium text-stone">
        참여자 ({participants.length}명)
      </h3>
      <ul className="flex flex-wrap gap-1.5">
        {participants.map((p) => {
          const isMe = p.id === currentParticipantId;
          const isJoined = !!p.color;
          const className = isJoined
            ? isMe
              ? "flex items-center gap-1.5 rounded-full border-2 border-ink-deep bg-canvas px-2.5 py-1 text-xs font-bold text-ink-deep"
              : "flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-2.5 py-1 text-xs text-ink-deep"
            : "flex items-center gap-1.5 rounded-full border border-dashed border-hairline-soft px-2.5 py-1 text-xs text-stone";
          return (
            <li key={p.id}>
              <span className={className}>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: p.color ?? "var(--color-stone)",
                  }}
                  aria-hidden
                />
                {p.name}
                {isMe ? <span className="text-[10px]">나</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
