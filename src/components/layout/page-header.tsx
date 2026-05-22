import { ReactNode } from "react";

type MaxWidth = "sm" | "md";

type Props = {
  title?: ReactNode;
  subtitle?: ReactNode;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  align?: "left" | "center";
  maxWidth?: MaxWidth;
};

const widthClassMap: Record<MaxWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
};

export function PageHeader({
  title,
  subtitle,
  leftSlot,
  rightSlot,
  align = "center",
  maxWidth = "md",
}: Props) {
  return (
    <header className="shrink-0 border-b border-hairline-soft bg-canvas">
      <div
        className={`relative mx-auto w-full ${widthClassMap[maxWidth]} px-4 py-5`}
      >
        {leftSlot ? (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            {leftSlot}
          </div>
        ) : null}
        {rightSlot ? (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {rightSlot}
          </div>
        ) : null}
        <div className={align === "center" ? "text-center" : "text-left"}>
          {title ? (
            <h1 className="text-2xl font-bold tracking-tight text-ink-deep">
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className="mt-1 text-sm text-slate">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
