export const PARTICIPANT_COLORS = [
  { name: "rose", hex: "#F87171" },
  { name: "orange", hex: "#FB923C" },
  { name: "amber", hex: "#FBBF24" },
  { name: "lime", hex: "#A3E635" },
  { name: "emerald", hex: "#34D399" },
  { name: "cyan", hex: "#22D3EE" },
  { name: "sky", hex: "#60A5FA" },
  { name: "violet", hex: "#A78BFA" },
  { name: "fuchsia", hex: "#E879F9" },
  { name: "slate", hex: "#64748B" },
] as const;

export type ParticipantColor = (typeof PARTICIPANT_COLORS)[number];

export function participantCookieKey(meetingId: string): string {
  return `participant_${meetingId}`;
}
