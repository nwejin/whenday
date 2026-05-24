"use client";

import { useEffect } from "react";
import type {
  RealtimePostgresChangesPayload,
  RealtimeChannel,
} from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Participant = {
  id: string;
  name: string;
  color: string | null;
  display_order: number;
};

type Availability = {
  id: string;
  participant_id: string;
  available_date: string;
};

type Meeting = {
  id: string;
  confirmed_date: string | null;
};

type Handlers = {
  onParticipantChange: (
    payload: RealtimePostgresChangesPayload<Participant>,
  ) => void;
  onAvailabilityChange: (
    payload: RealtimePostgresChangesPayload<Availability>,
  ) => void;
  onMeetingChange: (payload: RealtimePostgresChangesPayload<Meeting>) => void;
};

export function useMeetingRealtime(meetingId: string, handlers: Handlers) {
  const { onParticipantChange, onAvailabilityChange, onMeetingChange } =
    handlers;

  useEffect(() => {
    const supabase = createClient();
    const channel: RealtimeChannel = supabase
      .channel(`meeting:${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `meeting_id=eq.${meetingId}`,
        },
        (payload) =>
          onParticipantChange(
            payload as RealtimePostgresChangesPayload<Participant>,
          ),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "availabilities",
        },
        (payload) =>
          onAvailabilityChange(
            payload as RealtimePostgresChangesPayload<Availability>,
          ),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "meetings",
          filter: `id=eq.${meetingId}`,
        },
        (payload) =>
          onMeetingChange(payload as RealtimePostgresChangesPayload<Meeting>),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId, onParticipantChange, onAvailabilityChange, onMeetingChange]);
}
