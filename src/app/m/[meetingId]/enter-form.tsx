"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronLeft, Check, X } from "lucide-react";
import { PARTICIPANT_COLORS } from "@/lib/colors";
import { pickColor } from "./actions";
import { EnteringOverlay } from "./entering-overlay";

type Participant = {
  id: string;
  name: string;
  color: string | null;
  display_order: number;
};

type Step = "pick-name" | "confirm-name" | "pick-color" | "entering";

export function EnterForm({
  meetingId,
  participants,
}: {
  meetingId: string;
  participants: Participant[];
}) {
  const [step, setStep] = useState<Step>("pick-name");
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const confirmInputRef = useRef<HTMLInputElement>(null);

  const selectedParticipant =
    participants.find((p) => p.id === selectedParticipantId) ?? null;

  const usedColors = new Set(
    participants
      .filter((p) => p.id !== selectedParticipantId && p.color)
      .map((p) => p.color as string),
  );

  const isConfirmValid = selectedParticipant
    ? confirmInput.trim() === selectedParticipant.name
    : false;
  const canEnter =
    Boolean(selectedParticipantId) &&
    Boolean(selectedColor) &&
    !usedColors.has(selectedColor ?? "");

  useEffect(() => {
    if (step === "confirm-name") confirmInputRef.current?.focus();
  }, [step]);

  function handleSelectParticipant(p: Participant) {
    if (p.color) return;
    setSelectedParticipantId(p.id);
    setConfirmInput("");
    setSelectedColor(null);
    setError(null);
    setStep("confirm-name");
  }

  function handleBackToPickName() {
    setStep("pick-name");
    setSelectedParticipantId(null);
    setConfirmInput("");
    setSelectedColor(null);
    setError(null);
  }

  function handleConfirmName() {
    if (!isConfirmValid) {
      setError("입력한 이름이 슬롯과 일치하지 않습니다");
      return;
    }
    setError(null);
    setStep("pick-color");
  }

  function handleEnter() {
    if (!selectedParticipantId || !selectedColor || !selectedParticipant)
      return;
    setError(null);
    setStep("entering");

    const message = `${selectedParticipant.name}(으)로 입장합니다`;
    const animMs = 100 + Array.from(message).length * 45 + 500;
    const fireAt = Math.max(animMs - 200, 800);

    window.setTimeout(() => {
      startTransition(async () => {
        const result = await pickColor({
          meetingId,
          participantId: selectedParticipantId,
          color: selectedColor,
        });
        if (result?.error) {
          setStep("pick-color");
          setError(result.error);
        }
      });
    }, fireAt);
  }

  return (
    <>
      <section className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-md px-4 py-6">
          {step === "pick-name" && (
            <PickNameStep
              participants={participants}
              onPick={handleSelectParticipant}
            />
          )}
          {step === "confirm-name" && selectedParticipant && (
            <ConfirmNameStep
              expected={selectedParticipant.name}
              value={confirmInput}
              onChange={setConfirmInput}
              isValid={isConfirmValid}
              error={error}
              onBack={handleBackToPickName}
              inputRef={confirmInputRef}
            />
          )}
          {(step === "pick-color" || step === "entering") &&
            selectedParticipant && (
              <PickColorStep
                name={selectedParticipant.name}
                selectedColor={selectedColor}
                usedColors={usedColors}
                onSelect={(hex) => {
                  setSelectedColor(hex);
                  setError(null);
                }}
                onBack={() => {
                  setStep("confirm-name");
                  setSelectedColor(null);
                  setError(null);
                }}
              />
            )}
        </div>
      </section>

      <footer className="shrink-0 border-t border-hairline-soft bg-canvas">
        <div
          className="mx-auto w-full max-w-md px-4 pt-4"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
        >
          {error && step === "pick-color" && (
            <p className="mb-3 rounded-xl bg-critical/10 px-3 py-2 text-sm text-critical">
              {error}
            </p>
          )}
          <FooterButton
            step={step}
            isPending={isPending}
            isConfirmValid={isConfirmValid}
            canEnter={canEnter}
            onConfirmNext={handleConfirmName}
            onEnter={handleEnter}
          />
        </div>
      </footer>

      <EnteringOverlay
        open={step === "entering"}
        name={selectedParticipant?.name ?? ""}
      />
    </>
  );
}

function FooterButton({
  step,
  isPending,
  isConfirmValid,
  canEnter,
  onConfirmNext,
  onEnter,
}: {
  step: Step;
  isPending: boolean;
  isConfirmValid: boolean;
  canEnter: boolean;
  onConfirmNext: () => void;
  onEnter: () => void;
}) {
  const base =
    "flex w-full items-center justify-center gap-2 rounded-full bg-ink-deep px-6 py-4 text-base font-bold text-canvas transition active:bg-charcoal disabled:opacity-40";

  if (step === "pick-name") {
    return (
      <button type="button" disabled className={base}>
        이름을 선택해주세요
      </button>
    );
  }
  if (step === "confirm-name") {
    return (
      <button
        type="button"
        onClick={onConfirmNext}
        disabled={!isConfirmValid}
        className={base}
      >
        다음
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onEnter}
      disabled={!canEnter || step === "entering" || isPending}
      className={base}
    >
      {step === "entering" ? "입장 중..." : "입장하기"}
    </button>
  );
}

function PickNameStep({
  participants,
  onPick,
}: {
  participants: Participant[];
  onPick: (p: Participant) => void;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-charcoal">나는 누구인가요?</h2>
      <ul className="space-y-2">
        {participants.map((p) => {
          const isTaken = Boolean(p.color);
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPick(p)}
                disabled={isTaken}
                className={
                  isTaken
                    ? "flex w-full items-center gap-3 rounded-2xl border border-hairline-soft bg-surface-soft px-4 py-3 text-left opacity-60"
                    : "flex w-full items-center gap-3 rounded-2xl border border-hairline-soft bg-canvas px-4 py-3 text-left transition active:border-ink-deep active:bg-surface-soft"
                }
              >
                <span
                  className="h-5 w-5 shrink-0 rounded-full border border-hairline-soft"
                  style={{ backgroundColor: p.color ?? "transparent" }}
                  aria-hidden
                />
                <span className="flex-1 text-sm font-semibold text-ink-deep">
                  {p.name}
                </span>
                {isTaken && (
                  <span className="text-xs text-stone">입장 완료</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ConfirmNameStep({
  expected,
  value,
  onChange,
  isValid,
  error,
  onBack,
  inputRef,
}: {
  expected: string;
  value: string;
  onChange: (v: string) => void;
  isValid: boolean;
  error: string | null;
  onBack: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const inputClass = isValid
    ? "w-full rounded-xl border border-success bg-canvas px-4 py-3 text-base text-ink-deep outline-none"
    : error
      ? "w-full rounded-xl border border-critical bg-canvas px-4 py-3 text-base text-ink-deep outline-none"
      : "w-full rounded-xl border border-hairline-soft bg-canvas px-4 py-3 text-base text-ink-deep outline-none transition focus:border-ink-deep";

  return (
    <section className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-charcoal">
          한 번 더 확인할게요
        </h2>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-0.5 text-xs text-slate transition active:text-ink-deep"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          이전
        </button>
      </div>
      <div className="rounded-3xl border border-hairline-soft bg-surface-soft p-6 text-center">
        <p className="text-xs text-slate">선택한 이름</p>
        <p className="mt-1 text-2xl font-bold text-ink-deep">{expected}</p>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="confirm-name-input"
          className="block text-sm font-medium text-charcoal"
        >
          본인 이름을 다시 한 번 입력해주세요
        </label>
        <input
          id="confirm-name-input"
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          maxLength={30}
          className={inputClass}
        />
        {error && <p className="text-xs text-critical">{error}</p>}
      </div>
    </section>
  );
}

function PickColorStep({
  name,
  selectedColor,
  usedColors,
  onSelect,
  onBack,
}: {
  name: string;
  selectedColor: string | null;
  usedColors: Set<string>;
  onSelect: (hex: string) => void;
  onBack: () => void;
}) {
  return (
    <section className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-charcoal">
          {name}님의 색을 골라주세요
        </h2>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-0.5 text-xs text-slate transition active:text-ink-deep"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          이전
        </button>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {PARTICIPANT_COLORS.map((color) => {
          const isUsed = usedColors.has(color.hex);
          const isSelected = selectedColor === color.hex;
          const swatchClass = isUsed
            ? "relative aspect-square rounded-2xl opacity-25"
            : isSelected
              ? "relative aspect-square rounded-2xl ring-2 ring-ink-deep ring-offset-2 ring-offset-canvas transition"
              : "relative aspect-square rounded-2xl transition active:scale-95";
          return (
            <button
              key={color.hex}
              type="button"
              disabled={isUsed}
              onClick={() => onSelect(color.hex)}
              aria-label={`${color.name} 색상`}
              aria-pressed={isSelected}
              className={swatchClass}
              style={{ backgroundColor: color.hex }}
            >
              {isSelected && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check className="h-5 w-5 text-white" />
                </span>
              )}
              {isUsed && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <X className="h-5 w-5 text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-stone">
        ✕는 이미 다른 참여자가 선택한 색이에요
      </p>
    </section>
  );
}
