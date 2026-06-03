"use client";

import { ReactNode, useCallback, useState } from "react";
import { Dialog } from "@/components/ui/dialog";

type ConfirmOptions = {
  title: ReactNode;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

/**
 * 네이티브 window.confirm을 대체하는 디자인 시스템 confirm.
 * `await confirm({ title, message })`로 호출하고, 반환된 `confirmDialog`를
 * 트리 어딘가에 렌더링한다.
 */
export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  function settle(ok: boolean) {
    setPending((curr) => {
      curr?.resolve(ok);
      return null;
    });
  }

  const confirmDialog = (
    <Dialog
      open={!!pending}
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
      title={pending?.title ?? ""}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => settle(false)}
            className="flex-1 rounded-full border border-hairline px-6 py-4 text-base font-bold text-charcoal transition active:bg-surface-soft"
          >
            {pending?.cancelLabel ?? "취소"}
          </button>
          <button
            type="button"
            onClick={() => settle(true)}
            className="flex-1 rounded-full bg-ink-deep px-6 py-4 text-base font-bold text-canvas transition active:bg-charcoal"
          >
            {pending?.confirmLabel ?? "확인"}
          </button>
        </div>
      }
    >
      {pending?.message ? (
        <p className="text-sm text-slate">{pending.message}</p>
      ) : null}
    </Dialog>
  );

  return { confirm, confirmDialog };
}
