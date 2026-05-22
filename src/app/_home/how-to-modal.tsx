"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { X } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const STEPS = [
  {
    n: 1,
    title: "약속과 참여자 등록",
    desc: "제목, 후보 날짜, 참여자 명단 입력",
  },
  {
    n: 2,
    title: "링크 공유",
    desc: "참여자에게 공유 URL 전달",
  },
  {
    n: 3,
    title: "가능한 날짜 확인",
    desc: "모두가 가능한 날짜를 한눈에",
  },
];

export function HowToModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;

    if (prefersReducedMotion) {
      if (overlayRef.current) overlayRef.current.style.opacity = "1";
      if (dialogRef.current) {
        dialogRef.current.style.opacity = "1";
        dialogRef.current.style.transform = "none";
      }
    } else {
      if (overlayRef.current) {
        gsap.fromTo(
          overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.2, ease: "power2.out" },
        );
      }
      if (dialogRef.current) {
        gsap.fromTo(
          dialogRef.current,
          { scale: 0.7, opacity: 0, y: 24 },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: "back.out(1.8)",
          },
        );
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, prefersReducedMotion]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-deep/40 px-6"
      role="presentation"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-canvas p-6 shadow-[rgba(20,22,26,0.3)_0px_8px_24px_0px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2
              id="how-to-title"
              className="text-xl font-bold tracking-tight text-ink-deep"
            >
              사용 방법
            </h2>
            <p className="text-sm text-slate">3단계로 끝나요</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="-mr-1 -mt-1 flex h-9 w-9 items-center justify-center rounded-full text-charcoal transition active:bg-surface-soft"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ol className="mt-5 space-y-3">
          {STEPS.map(({ n, title, desc }) => (
            <li
              key={n}
              className="flex gap-3 rounded-xl border border-hairline-soft bg-canvas p-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-deep text-sm font-bold text-canvas">
                {n}
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-ink-deep">{title}</p>
                <p className="text-sm text-slate">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
