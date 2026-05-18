"use client";

import { useState, useTransition } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CellDetailSheet } from "@/components/calendar/cell-detail-sheet";
import { confirmMeeting } from "./actions";

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

export function ResultView({
  meetingId,
  isHost,
  confirmedDate,
  dateRangeStart,
  dateRangeEnd,
  participants,
  availabilities,
}: {
  meetingId: string;
  isHost: boolean;
  confirmedDate: string | null;
  dateRangeStart: string;
  dateRangeEnd: string;
  participants: Participant[];
  availabilities: Availability[];
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isConfirming, startTransition] = useTransition();

  function handleConfirm(date: string) {
    startTransition(async () => {
      await confirmMeeting({ meetingId, date });
    });
  }

  return (
    <>
      <Calendar
        mode="result"
        dateRangeStart={dateRangeStart}
        dateRangeEnd={dateRangeEnd}
        participants={participants}
        availabilities={availabilities}
        onCellClick={setSelectedDate}
      />
      <CellDetailSheet
        selectedDate={selectedDate}
        onClose={() => setSelectedDate(null)}
        participants={participants}
        availabilities={availabilities}
        isHost={isHost}
        confirmedDate={confirmedDate}
        onConfirm={handleConfirm}
        isConfirming={isConfirming}
      />
    </>
  );
}
