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
    <div className="w-full max-w-sm space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {mode === "signin" ? "로그인" : "가입"}
        </h1>
        <p className="text-sm text-gray-500">
          {mode === "signin"
            ? "이메일과 비밀번호로 로그인"
            : "이메일과 비밀번호로 가입"}
        </p>
      </header>

      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="redirect" value={redirectTo} />
        <input
          type="email"
          name="email"
          placeholder="이메일"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-gray-400"
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
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-gray-400"
        />
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="block w-full rounded-2xl bg-gray-900 px-6 py-4 text-base font-medium text-white transition hover:bg-gray-800 active:bg-gray-700 disabled:opacity-50"
        >
          {isPending ? "처리 중..." : mode === "signin" ? "로그인" : "가입하기"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        {mode === "signin" ? "처음이신가요?" : "이미 계정이 있나요?"}{" "}
        <button
          type="button"
          onClick={toggleMode}
          className="font-medium text-gray-900 underline underline-offset-2"
        >
          {mode === "signin" ? "가입하기" : "로그인하기"}
        </button>
      </p>
    </div>
  );
}
