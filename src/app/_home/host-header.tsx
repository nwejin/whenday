"use client";

import { useState } from "react";
import { HelpCircle, LogOut } from "lucide-react";
import { signOut } from "@/app/login/actions";
import { HowToModal } from "./how-to-modal";

export function HostHeader() {
  const [showHowTo, setShowHowTo] = useState(false);

  return (
    <>
      <header className="shrink-0 border-b border-hairline-soft bg-canvas">
        <div className="mx-auto flex w-full max-w-md items-start justify-between gap-4 px-4 pt-6 pb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-ink-deep">
              whenday
            </h1>
            <p className="text-sm text-slate">여러 명의 약속을 한 번에</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowHowTo(true)}
              aria-label="사용 방법"
              className="flex h-10 w-10 items-center justify-center rounded-full text-charcoal transition active:bg-surface-soft"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            <form action={signOut}>
              <button
                type="submit"
                aria-label="로그아웃"
                className="flex h-10 w-10 items-center justify-center rounded-full text-charcoal transition active:bg-surface-soft"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </header>
      <HowToModal open={showHowTo} onClose={() => setShowHowTo(false)} />
    </>
  );
}
