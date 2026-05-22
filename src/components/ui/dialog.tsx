"use client";

import { ReactNode } from "react";
import { Drawer } from "vaul";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-ink-deep/40" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90vh] w-full max-w-md flex-col rounded-t-3xl bg-canvas focus:outline-none"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
          }}
        >
          <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-hairline" />
          <div className="shrink-0 px-6 pt-4 pb-2">
            <Drawer.Title className="text-lg font-bold text-ink-deep">
              {title}
            </Drawer.Title>
            {description ? (
              <Drawer.Description className="mt-1 text-sm text-slate">
                {description}
              </Drawer.Description>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-3">
            {children}
          </div>
          {footer ? (
            <div className="shrink-0 border-t border-hairline-soft px-6 pt-4">
              {footer}
            </div>
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
