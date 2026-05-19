"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, signUp } from "./actions";

type Mode = "signin" | "signup";

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  function toggleMode() {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError(null);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const action = mode === "signin" ? signIn : signUp;
      const result = await action(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <header className="shrink-0 border-b border-hairline-soft bg-canvas">
        <div className="mx-auto w-full max-w-sm px-4 py-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-ink-deep">
            {mode === "signin" ? "로그인" : "가입"}
          </h1>
          <p className="mt-1 text-sm text-slate">
            {mode === "signin"
              ? "이메일과 비밀번호로 로그인"
              : "이메일과 비밀번호로 가입"}
          </p>
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-sm px-4 py-6">
          <form
            id="login-form"
            action={handleSubmit}
            className="space-y-3"
          >
            <input type="hidden" name="redirect" value={redirectTo} />
            <input
              type="email"
              name="email"
              placeholder="이메일"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-hairline-soft bg-canvas px-4 py-3 text-base text-ink-deep outline-none transition focus:border-ink-deep"
            />
            <input
              type="password"
              name="password"
              placeholder="비밀번호 (6자 이상)"
              required
              minLength={6}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              className="w-full rounded-xl border border-hairline-soft bg-canvas px-4 py-3 text-base text-ink-deep outline-none transition focus:border-ink-deep"
            />
          </form>

          <p className="mt-6 text-center text-sm text-slate">
            {mode === "signin" ? "처음이신가요?" : "이미 계정이 있나요?"}{" "}
            <button
              type="button"
              onClick={toggleMode}
              className="font-semibold text-ink-deep underline underline-offset-2"
            >
              {mode === "signin" ? "가입하기" : "로그인하기"}
            </button>
          </p>
        </div>
      </section>

      <footer className="shrink-0 border-t border-hairline-soft bg-canvas">
        <div
          className="mx-auto w-full max-w-sm px-4 pt-4"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
        >
          {error && (
            <p className="mb-3 rounded-xl bg-critical/10 px-3 py-2 text-sm text-critical">
              {error}
            </p>
          )}
          <button
            type="submit"
            form="login-form"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-deep px-6 py-4 text-base font-bold text-canvas transition active:bg-charcoal disabled:opacity-40"
          >
            {isPending ? "처리 중..." : mode === "signin" ? "로그인" : "가입하기"}
          </button>
        </div>
      </footer>
    </>
  );
}
