"use client";

import { useOptimistic, useTransition } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { toggleAvailability } from "./actions";

type Participant = {
  id: string;
  name: string;
  color: string | null;
  display_order: number;
};

type Availability = { participant_id: string; available_date: string };

type ToggleAction = { type: "toggle"; date: string };

export function SelectCalendar({
  meetingId,
  dateRangeStart,
  dateRangeEnd,
  participants,
  currentParticipantId,
  initialAvailabilities,
}: {
  meetingId: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  participants: Participant[];
  currentParticipantId: string;
  initialAvailabilities: Availability[];
}) {
  const [optimisticAvailabilities, applyOptimistic] = useOptimistic(
    initialAvailabilities,
    (state, action: ToggleAction) => {
      const exists = state.some(
        (a) =>
          a.participant_id === currentParticipantId &&
          a.available_date === action.date,
      );
      if (exists) {
        return state.filter(
          (a) =>
            !(
              a.participant_id === currentParticipantId &&
              a.available_date === action.date
            ),
        );
      }
      return [
        ...state,
        { participant_id: currentParticipantId, available_date: action.date },
      ];
    },
  );

  const [, startTransition] = useTransition();

  function handleToggle(date: string) {
    startTransition(async () => {
      applyOptimistic({ type: "toggle", date });
      await toggleAvailability({
        meetingId,
        participantId: currentParticipantId,
        date,
      });
    });
  }

  return (
    <Calendar
      dateRangeStart={dateRangeStart}
      dateRangeEnd={dateRangeEnd}
      participants={participants}
      availabilities={optimisticAvailabilities}
      mode="select"
      currentParticipantId={currentParticipantId}
      onToggleDate={handleToggle}
    />
  );
}
