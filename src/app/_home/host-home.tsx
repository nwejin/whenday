"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import {
  PrimaryFooterButton,
  PrimaryFooterLink,
  StickyFooter,
} from "@/components/layout/sticky-footer";
import { HostHeader } from "./host-header";
import { MeetingCard, Meeting } from "./meeting-card";
import { deleteMeetings } from "./actions";

type Props = {
  meetings: Meeting[];
};

export function HostHome({ meetings }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const hasMeetings = meetings.length > 0;

  function toggleEdit() {
    setEditMode((prev) => !prev);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDelete() {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `선택한 약속 ${selectedIds.size}개를 정말 삭제할까요? 참여자 정보도 모두 사라져요.`,
      )
    ) {
      return;
    }
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      await deleteMeetings(ids);
      setEditMode(false);
      setSelectedIds(new Set());
    });
  }

  return (
    <AppShell
      header={
        <HostHeader
          editMode={editMode}
          onToggleEdit={toggleEdit}
          canEdit={hasMeetings}
        />
      }
      footer={
        editMode ? (
          <StickyFooter
            primary={
              <PrimaryFooterButton
                type="button"
                onClick={handleDelete}
                disabled={selectedIds.size === 0 || isPending}
              >
                {isPending
                  ? "삭제 중..."
                  : selectedIds.size === 0
                    ? "약속을 선택해주세요"
                    : `${selectedIds.size}개 삭제`}
              </PrimaryFooterButton>
            }
          />
        ) : (
          <StickyFooter
            primary={
              <PrimaryFooterLink href="/new">
                <Plus className="h-5 w-5" />
                <span>약속 만들기</span>
              </PrimaryFooterLink>
            }
          />
        )
      }
    >
      <div className="mx-auto w-full max-w-md px-4 py-6">
        {hasMeetings ? (
          <div className="flex flex-col gap-3">
            {meetings.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                editMode={editMode}
                selected={selectedIds.has(m.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-semibold text-ink-deep">
        아직 만든 약속이 없어요
      </p>
      <p className="mt-1 text-xs text-stone">
        하단 버튼으로 첫 약속을 만들어보세요
      </p>
    </div>
  );
}
