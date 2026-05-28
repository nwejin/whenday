"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function CopyShareLink({ url, label }: { url: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        throw new Error("clipboard unavailable");
      }
      setState("copied");
      setTimeout(() => setState("idle"), 1500);
    } catch {
      window.prompt("링크를 복사해서 공유해주세요", url);
      setState("failed");
      setTimeout(() => setState("idle"), 2000);
    }
  }

  if (label) {
    return (
      <button
        type="button"
        onClick={copy}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-hairline bg-canvas px-6 py-4 text-base font-bold text-ink-deep transition active:bg-surface-soft"
      >
        {state === "copied" ? (
          <Check className="h-4 w-4" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        <span>{state === "copied" ? "복사됐어요" : label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="공유 링크 복사"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-soft text-ink-deep transition active:bg-hairline"
    >
      {state === "copied" ? (
        <Check className="h-4 w-4" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </button>
  );
}
