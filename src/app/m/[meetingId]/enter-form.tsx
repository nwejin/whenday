"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  PrimaryFooterButton,
  StickyFooter,
} from "@/components/layout/sticky-footer";
import { PARTICIPANT_COLORS } from "@/lib/colors";
import { pickColor } from "./actions";

type Participant = {
  id: string;
  name: string;
  color: string | null;
  display_order: number;
};

export function EnterForm({
  meetingId,
  title,
  participants,
}: {
  meetingId: string;
  title: string;
  participants: Participant[];
}) {
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const usedColors = new Set(
    participants
      .filter((p) => p.id !== selectedParticipantId && p.color)
      .map((p) => p.color as string),
  );

  const canEnter =
    !!selectedParticipantId && !!selectedColor && !usedColors.has(selectedColor);

  function handleSelectParticipant(p: Participant) {
    if (p.color) return;
    setSelectedParticipantId(p.id);
    setError(null);
    if (selectedColor && usedColors.has(selectedColor)) {
      setSelectedColor(null);
    }
  }

  function handleEnter() {
    if (!canEnter) return;
    setError(null);
    startTransition(async () => {
      const result = await pickColor({
        meetingId,
        participantId: selectedParticipantId!,
        color: selectedColor!,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <AppShell
      header={<PageHeader title={title} subtitle="이름과 색을 골라주세요" />}
      footer={
        <StickyFooter
          back={{ fallbackHref: "/" }}
          error={error}
          primary={
            <PrimaryFooterButton
              type="button"
              onClick={handleEnter}
              disabled={!canEnter || isPending}
            >
              {isPending ? "입장 중..." : "입장하기"}
            </PrimaryFooterButton>
          }
        />
      }
    >
      <div className="mx-auto w-full max-w-md space-y-8 px-4 py-6">
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-charcoal">
            1. 본인 이름 선택
          </h2>
          <ul className="flex flex-wrap gap-2">
            {participants.map((p) => {
              const isTaken = !!p.color;
              const isSelected = p.id === selectedParticipantId;
              const className = isTaken
                ? "flex items-center gap-1.5 rounded-full border border-hairline-soft bg-surface-soft py-2 pl-2.5 pr-3 text-sm text-stone opacity-70"
                : isSelected
                  ? "flex items-center gap-1.5 rounded-full border-2 border-ink-deep bg-canvas px-3 py-1.5 text-sm font-bold text-ink-deep"
                  : "flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-2 text-sm text-ink-deep transition active:bg-surface-soft";
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={isTaken}
                    onClick={() => handleSelectParticipant(p)}
                    className={className}
                  >
                    {p.color ? (
                      <span
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                        aria-hidden
                      />
                    ) : null}
                    <span>{p.name}</span>
                    {isTaken ? (
                      <span className="text-[10px] text-stone">완료</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-charcoal">2. 색 선택</h2>
          <div className="grid grid-cols-5 gap-3">
            {PARTICIPANT_COLORS.map((color) => {
              const isUsed = usedColors.has(color.hex);
              const isSelected = selectedColor === color.hex;
              const disabled = !selectedParticipantId || isUsed;
              const swatchClass = !selectedParticipantId
                ? "relative aspect-square rounded-2xl opacity-30"
                : isUsed
                  ? "relative aspect-square rounded-2xl opacity-25"
                  : isSelected
                    ? "relative aspect-square rounded-2xl ring-2 ring-ink-deep ring-offset-2 ring-offset-canvas"
                    : "relative aspect-square rounded-2xl transition active:scale-95";
              return (
                <button
                  key={color.hex}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setSelectedColor(color.hex);
                    setError(null);
                  }}
                  aria-label={`${color.name} 색상`}
                  aria-pressed={isSelected}
                  className={swatchClass}
                  style={{ backgroundColor: color.hex }}
                >
                  {isSelected ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" strokeWidth={3} />
                    </span>
                  ) : null}
                  {isUsed ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <X className="h-5 w-5 text-white" strokeWidth={3} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-stone">
            {selectedParticipantId
              ? "✕는 다른 사람이 쓰는 색이에요"
              : "먼저 이름을 골라주세요"}
          </p>
        </section>
      </div>
    </AppShell>
  );
}
