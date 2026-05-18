"use client";

import { useState, useTransition } from "react";
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
  participants,
}: {
  meetingId: string;
  participants: Participant[];
}) {
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 다른 참여자가 이미 고른 색상은 사용 불가
  const usedColors = new Set(
    participants
      .filter((p) => p.id !== selectedParticipantId && p.color)
      .map((p) => p.color as string),
  );

  function handleSelectParticipant(p: Participant) {
    setSelectedParticipantId(p.id);
    setSelectedColor(p.color); // 기존에 골랐던 색이 있으면 자동 선택
    setError(null);
  }

  function handleSubmit() {
    if (!selectedParticipantId) return setError("이름을 선택해주세요");
    if (!selectedColor) return setError("색상을 선택해주세요");
    setError(null);
    startTransition(async () => {
      const result = await pickColor({
        meetingId,
        participantId: selectedParticipantId,
        color: selectedColor,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={() => handleSubmit()} className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-gray-900">나는 누구?</h2>
        <ul className="space-y-2">
          {participants.map((p) => {
            const isSelected = p.id === selectedParticipantId;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => handleSelectParticipant(p)}
                  className={
                    isSelected
                      ? "flex w-full items-center gap-3 rounded-xl border border-gray-900 bg-gray-50 px-4 py-3 text-left transition"
                      : "flex w-full items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 text-left transition hover:border-gray-300"
                  }
                >
                  <span
                    className="h-5 w-5 shrink-0 rounded-full border border-gray-200"
                    style={{ backgroundColor: p.color ?? "transparent" }}
                  />
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {p.name}
                  </span>
                  {p.color && !isSelected && (
                    <span className="text-xs text-gray-400">입장함</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {selectedParticipantId && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-gray-900">색상 선택</h2>
          <div className="grid grid-cols-6 gap-2">
            {PARTICIPANT_COLORS.map((color) => {
              const isUsed = usedColors.has(color.hex);
              const isSelected = selectedColor === color.hex;
              return (
                <button
                  key={color.hex}
                  type="button"
                  disabled={isUsed}
                  onClick={() => setSelectedColor(color.hex)}
                  className={
                    isUsed
                      ? "relative aspect-square rounded-full opacity-30"
                      : isSelected
                        ? "relative aspect-square rounded-full ring-2 ring-gray-900 ring-offset-2"
                        : "relative aspect-square rounded-full transition hover:scale-105"
                  }
                  style={{ backgroundColor: color.hex }}
                  aria-label={`${color.name} 선택`}
                >
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                      ✓
                    </span>
                  )}
                  {isUsed && (
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
                      ✕
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400">
            ✕는 이미 다른 참여자가 선택한 색상이에요
          </p>
        </section>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!selectedParticipantId || !selectedColor || isPending}
        className="block w-full rounded-2xl bg-gray-900 px-6 py-4 text-base font-medium text-white transition hover:bg-gray-800 active:bg-gray-700 disabled:opacity-50"
      >
        {isPending ? "입장 중..." : "입장하기"}
      </button>
    </form>
  );
}
