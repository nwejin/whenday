import { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { BackButton } from "./back-button";

type MaxWidth = "sm" | "md";

type Props = {
  back?: {
    fallbackHref?: string;
    label?: string;
    onBeforeNavigate?: () => boolean | Promise<boolean>;
  };
  primary?: ReactNode;
  error?: string | null;
  maxWidth?: MaxWidth;
};

const widthClassMap: Record<MaxWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
};

export function StickyFooter({
  back,
  primary,
  error,
  maxWidth = "md",
}: Props) {
  return (
    <footer className="shrink-0 border-t border-hairline-soft bg-canvas">
      <div
        className={`mx-auto w-full ${widthClassMap[maxWidth]} px-4 pt-4`}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
      >
        {error ? (
          <p className="mb-3 rounded-xl bg-critical/10 px-3 py-2 text-sm text-critical">
            {error}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          {back ? (
            <BackButton
              fallbackHref={back.fallbackHref}
              label={back.label}
              onBeforeNavigate={back.onBeforeNavigate}
            />
          ) : null}
          {primary ? <div className="flex-1">{primary}</div> : null}
        </div>
      </div>
    </footer>
  );
}

const primaryButtonClass =
  "flex w-full items-center justify-center gap-2 rounded-full bg-ink-deep px-6 py-4 text-base font-bold text-canvas transition active:bg-charcoal disabled:opacity-40";

export function PrimaryFooterButton({
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={className ? `${primaryButtonClass} ${className}` : primaryButtonClass}
    >
      {children}
    </button>
  );
}

export function PrimaryFooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={primaryButtonClass}>
      {children}
    </Link>
  );
}
