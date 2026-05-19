"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function EnteringOverlay({
  open,
  name,
}: {
  open: boolean;
  name: string;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const charsRef = useRef<HTMLSpanElement[]>([]);
  const message = `${name}(으)로 입장합니다`;
  const chars = Array.from(message);

  useEffect(() => {
    if (!open) return;

    gsap.fromTo(
      overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.28, ease: "power2.out" },
    );

    gsap.fromTo(
      charsRef.current,
      { y: 16, opacity: 0, rotateX: -20 },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        duration: 0.5,
        ease: "back.out(2.2)",
        stagger: 0.045,
        delay: 0.1,
      },
    );
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-deep/30"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <p className="px-6 text-center text-2xl font-bold text-canvas">
        {chars.map((c, i) => (
          <span
            key={i}
            ref={(el) => {
              if (el) charsRef.current[i] = el;
            }}
            className="inline-block"
            style={{ whiteSpace: c === " " ? "pre" : undefined }}
          >
            {c}
          </span>
        ))}
      </p>
    </div>
  );
}
