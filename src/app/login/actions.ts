"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const KOREAN_ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "User already registered": "이미 가입된 이메일입니다.",
  "Password should be at least": "비밀번호는 6자 이상이어야 합니다.",
  "Email rate limit exceeded": "잠시 후 다시 시도해주세요.",
};

function toKoreanError(message: string): string {
  for (const [key, value] of Object.entries(KOREAN_ERROR_MAP)) {
    if (message.includes(key)) return value;
  }
  return message;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/") || "/";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: toKoreanError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/") || "/";

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: toKoreanError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}
