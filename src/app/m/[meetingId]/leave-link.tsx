import { RotateCcw } from "lucide-react";
import { leaveAsCurrentParticipant } from "./actions";

export function LeaveLink({ meetingId }: { meetingId: string }) {
  return (
    <form action={leaveAsCurrentParticipant}>
      <input type="hidden" name="meetingId" value={meetingId} />
      <button
        type="submit"
        className="inline-flex items-center gap-1 text-xs text-slate underline underline-offset-4 transition active:text-ink-deep"
      >
        <RotateCcw className="h-3 w-3" aria-hidden />
        다른 사람으로 들어가기
      </button>
    </form>
  );
}
