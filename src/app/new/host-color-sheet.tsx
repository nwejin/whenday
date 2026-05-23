"use client";

import { Check } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { PARTICIPANT_COLORS } from "@/lib/colors";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: string | null;
  onSelect: (hex: string) => void;
};

export function HostColorSheet({ open, onOpenChange, selected, onSelect }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="방장 색 선택"
      description="내 일정을 표시할 색을 골라주세요"
    >
      <div className="grid grid-cols-5 gap-3 pb-3">
        {PARTICIPANT_COLORS.map((color) => {
          const isSelected = selected === color.hex;
          const className = isSelected
            ? "relative aspect-square rounded-2xl ring-2 ring-ink-deep ring-offset-2 ring-offset-canvas"
            : "relative aspect-square rounded-2xl transition active:scale-95";
          return (
            <button
              key={color.hex}
              type="button"
              onClick={() => {
                onSelect(color.hex);
                onOpenChange(false);
              }}
              aria-label={`${color.name} 색상`}
              aria-pressed={isSelected}
              className={className}
              style={{ backgroundColor: color.hex }}
            >
              {isSelected ? (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check className="h-5 w-5 text-white" strokeWidth={3} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}
