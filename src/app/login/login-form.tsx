"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  PrimaryFooterButton,
  StickyFooter,
} from "@/components/layout/sticky-footer";
import { signIn, signUp } from "./actions";

type Mode = "signin" | "signup";

const inputClass =
  "w-full rounded-xl border border-hairline-soft bg-canvas px-4 py-3 text-base text-ink-deep outline-none transition focus:border-ink-deep";

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

    if (mode === "signup") {
      const password = String(formData.get("password") ?? "");
      const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
      if (password !== passwordConfirm) {
        setError("비밀번호가 일치하지 않습니다");
        return;
      }
    }

    startTransition(async () => {
      const action = mode === "signin" ? signIn : signUp;
      const result = await action(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <AppShell
      header={
        <PageHeader
          title={mode === "signin" ? "로그인" : "가입"}
          subtitle={
            mode === "signin"
              ? "이메일과 비밀번호로 로그인"
              : "이메일과 비밀번호로 가입"
          }
          maxWidth="sm"
        />
      }
      footer={
        <StickyFooter
          maxWidth="sm"
          error={error}
          back={{ fallbackHref: "/" }}
          primary={
            <PrimaryFooterButton
              type="submit"
              form="login-form"
              disabled={isPending}
            >
              {isPending
                ? "처리 중..."
                : mode === "signin"
                  ? "로그인"
                  : "가입하기"}
            </PrimaryFooterButton>
          }
        />
      }
    >
      <div className="mx-auto flex h-full w-full max-w-sm flex-col justify-center px-4 py-6">
        <form id="login-form" action={handleSubmit} className="space-y-3">
          <input type="hidden" name="redirect" value={redirectTo} />
          <input
            type="email"
            name="email"
            placeholder="이메일"
            required
            autoComplete="email"
            className={inputClass}
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
            className={inputClass}
          />
          {mode === "signup" ? (
            <input
              type="password"
              name="passwordConfirm"
              placeholder="비밀번호 재입력"
              required
              minLength={6}
              autoComplete="new-password"
              className={inputClass}
            />
          ) : null}
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
    </AppShell>
  );
}
