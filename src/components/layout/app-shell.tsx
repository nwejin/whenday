import { ReactNode } from "react";

type Props = {
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function AppShell({ header, footer, children }: Props) {
  return (
    <main className="flex h-dvh flex-col bg-canvas">
      {header}
      <section className="min-h-0 flex-1 overflow-y-auto">{children}</section>
      {footer}
    </main>
  );
}
