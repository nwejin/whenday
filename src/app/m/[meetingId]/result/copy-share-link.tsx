"use client";

import { useState } from "react";

export function CopyShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 권한 없을 시 무시 (예: insecure context)
    }
  }

  return (
    <div className="space-y-2 rounded-2xl border border-hairline-soft bg-surface-soft p-4">
      <p className="text-xs font-medium text-slate">공유 링크</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          readOnly
          className="flex-1 rounded-xl bg-canvas px-3 py-2 text-sm text-ink outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-xl bg-ink-deep px-3 py-2 text-sm font-semibold text-canvas transition active:bg-charcoal"
        >
          {copied ? "복사됨" : "복사"}
        </button>
      </div>
    </div>
  );
}
