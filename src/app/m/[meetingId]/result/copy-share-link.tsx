"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function CopyShareLink({ url }: { url: string }) {
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
