"use client";

import Link from "next/link";

export default function ResultError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-6 bg-canvas px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-lg font-bold text-ink-deep">
          결과를 불러오지 못했어요
        </h1>
        <p className="text-sm text-slate">
          잠시 후 다시 시도하거나 홈으로 돌아가 주세요.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2">
        <button
          type="button"
          onClick={reset}
          className="flex w-full items-center justify-center rounded-full bg-ink-deep px-6 py-4 text-base font-bold text-canvas transition active:bg-charcoal"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="flex w-full items-center justify-center rounded-full border border-hairline px-6 py-4 text-base font-bold text-charcoal transition active:bg-surface-soft"
        >
          홈으로
        </Link>
      </div>
    </main>
  );
}
