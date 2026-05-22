"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string) => void;
  existingNames: string[];
};

export function AddParticipantDialog({
  open,
  onOpenChange,
  onAdd,
  existingNames,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="참여자 추가"
      description="이름을 입력하고 추가하세요"
    >
      {open ? (
        <DialogForm
          onAdd={onAdd}
          existingNames={existingNames}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  );
}

function DialogForm({
  onAdd,
  existingNames,
  onClose,
}: {
  onAdd: (name: string) => void;
  existingNames: string[];
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = inputRef.current?.value.trim() ?? "";
    if (!trimmed) {
      setError("이름을 입력해주세요");
      return;
    }
    if (existingNames.includes(trimmed)) {
      setError("이미 추가된 이름입니다");
      return;
    }
    onAdd(trimmed);
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pb-3">
      <input
        ref={inputRef}
        type="text"
        defaultValue=""
        onChange={() => {
          if (error) setError(null);
        }}
        placeholder="예: 친구1"
        maxLength={20}
        className="w-full rounded-xl border border-hairline-soft bg-canvas px-4 py-3 text-base text-ink-deep outline-none transition focus:border-ink-deep"
      />
      {error ? <p className="text-sm text-critical">{error}</p> : null}
      <button
        type="submit"
        className="flex w-full items-center justify-center rounded-full bg-ink-deep px-6 py-4 text-base font-bold text-canvas transition active:bg-charcoal"
      >
        추가하기
      </button>
    </form>
  );
}
