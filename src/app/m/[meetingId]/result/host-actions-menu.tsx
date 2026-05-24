"use client";

import { useState, useTransition } from "react";
import { MoreVertical, RotateCcw, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { deleteMeeting, unconfirmMeeting } from "./actions";

type Props = {
  meetingId: string;
  isConfirmed: boolean;
  onUnconfirmed?: () => void;
};

export function HostActionsMenu({
  meetingId,
  isConfirmed,
  onUnconfirmed,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleUnconfirm() {
    if (
      !window.confirm("확정을 취소할까요? 다시 가능한 날짜를 받게 돼요.")
    ) {
      return;
    }
    setOpen(false);
    startTransition(async () => {
      const result = await unconfirmMeeting({ meetingId });
      if (!result?.error) onUnconfirmed?.();
    });
  }

  function handleDelete() {
    if (
      !window.confirm(
        "이 약속을 정말 삭제할까요? 참여자 정보도 모두 사라져요.",
      )
    ) {
      return;
    }
    setOpen(false);
    startTransition(async () => {
      await deleteMeeting({ meetingId });
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="방장 메뉴"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-soft text-ink-deep transition active:bg-hairline"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="약속 관리"
        description="방장만 보여요"
      >
        <ul className="space-y-1 pb-3">
          {isConfirmed ? (
            <li>
              <button
                type="button"
                onClick={handleUnconfirm}
                disabled={isPending}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-ink-deep transition active:bg-surface-soft disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4 text-charcoal" />
                <span>확정 취소</span>
              </button>
            </li>
          ) : null}
          <li>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-critical transition active:bg-critical/10 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
              <span>약속 삭제</span>
            </button>
          </li>
        </ul>
      </Dialog>
    </>
  );
}
