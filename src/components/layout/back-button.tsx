"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

type Props = {
  fallbackHref?: string;
  label?: string;
  onBeforeNavigate?: () => boolean;
};

export function BackButton({
  fallbackHref = "/",
  label = "뒤로",
  onBeforeNavigate,
}: Props) {
  const router = useRouter();

  function handleClick() {
    if (onBeforeNavigate && !onBeforeNavigate()) return;
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="뒤로가기"
      className="flex shrink-0 items-center gap-1 rounded-full border border-hairline px-4 py-4 text-sm font-medium text-charcoal transition active:bg-surface-soft"
    >
      <ChevronLeft className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
