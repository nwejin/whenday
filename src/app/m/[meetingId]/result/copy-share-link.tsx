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
    <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-medium text-gray-500">공유 링크</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          readOnly
          className="flex-1 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          {copied ? "복사됨" : "복사"}
        </button>
      </div>
    </div>
  );
}
