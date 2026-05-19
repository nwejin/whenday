"use client";

import { Drawer } from "vaul";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

type Participant = {
  id: string;
  name: string;
  color: string | null;
  display_order: number;
};

type Availability = {
  participant_id: string;
  available_date: string;
};

export function CellDetailSheet({
  selectedDate,
  onClose,
  participants,
  availabilities,
  isHost,
  confirmedDate,
  onConfirm,
  isConfirming,
}: {
  selectedDate: string | null;
  onClose: () => void;
  participants: Participant[];
  availabilities: Availability[];
  isHost: boolean;
  confirmedDate: string | null;
  onConfirm: (date: string) => void;
  isConfirming: boolean;
}) {
  const open = selectedDate !== null;

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[85vh] flex-col rounded-t-2xl bg-canvas outline-none">
          <div className="mx-auto mt-3 h-1 w-12 shrink-0 rounded-full bg-stone" />
          {selectedDate && (
            <SheetBody
              selectedDate={selectedDate}
              participants={participants}
              availabilities={availabilities}
              isHost={isHost}
              confirmedDate={confirmedDate}
              onConfirm={onConfirm}
              isConfirming={isConfirming}
            />
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function SheetBody({
  selectedDate,
  participants,
  availabilities,
  isHost,
  confirmedDate,
  onConfirm,
  isConfirming,
}: {
  selectedDate: string;
  participants: Participant[];
  availabilities: Availability[];
  isHost: boolean;
  confirmedDate: string | null;
  onConfirm: (date: string) => void;
  isConfirming: boolean;
}) {
  const availableSet = new Set(
    availabilities
      .filter((a) => a.available_date === selectedDate)
      .map((a) => a.participant_id),
  );

  const entered = participants.filter((p) => p.color);
  const notEntered = participants.filter((p) => !p.color);
  const available = entered.filter((p) => availableSet.has(p.id));
  const unavailable = entered.filter((p) => !availableSet.has(p.id));

  const isAllAvailable =
    participants.length > 0 && available.length === participants.length;
  const isConfirmedDate = confirmedDate === selectedDate;
  const formattedDate = format(parseISO(selectedDate), "M월 d일 EEEE", {
    locale: ko,
  });

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="space-y-1 pb-6">
        <Drawer.Title className="text-xl font-bold text-ink-deep">
          {formattedDate}
        </Drawer.Title>
        <Drawer.Description className="text-sm text-slate">
          {available.length}/{participants.length} 가능
          {isAllAvailable && " · 모두 가능 ⭐"}
          {isConfirmedDate && " · 확정됨 ✓"}
        </Drawer.Description>
      </div>

      <div className="space-y-5">
        {available.length > 0 && (
          <Section title="가능">
            {available.map((p) => (
              <Row
                key={p.id}
                name={p.name}
                colorHex={p.color ?? undefined}
                variant="available"
              />
            ))}
          </Section>
        )}
        {unavailable.length > 0 && (
          <Section title="불가능">
            {unavailable.map((p) => (
              <Row
                key={p.id}
                name={p.name}
                colorHex={p.color ?? undefined}
                variant="unavailable"
              />
            ))}
          </Section>
        )}
        {notEntered.length > 0 && (
          <Section title="미입력">
            {notEntered.map((p) => (
              <Row key={p.id} name={p.name} variant="not-entered" />
            ))}
          </Section>
        )}
      </div>

      {isHost && !confirmedDate && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => onConfirm(selectedDate)}
            disabled={!isAllAvailable || isConfirming}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-deep px-6 py-4 text-base font-bold text-canvas transition active:bg-charcoal disabled:opacity-40"
          >
            {isConfirming
              ? "확정 중..."
              : isAllAvailable
                ? "이 날로 확정"
                : "전원 가능 시 확정 가능"}
          </button>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-stone">
        {title}
      </h3>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  );
}

function Row({
  name,
  colorHex,
  variant,
}: {
  name: string;
  colorHex?: string;
  variant: "available" | "unavailable" | "not-entered";
}) {
  return (
    <li className="flex items-center gap-3">
      <span
        className="h-4 w-4 shrink-0 rounded-full border border-hairline-soft"
        style={{ backgroundColor: colorHex ?? "transparent" }}
      />
      <span
        className={
          variant === "available"
            ? "text-sm font-medium text-ink-deep"
            : variant === "unavailable"
              ? "text-sm text-slate line-through"
              : "text-sm text-stone"
        }
      >
        {name}
      </span>
    </li>
  );
}
