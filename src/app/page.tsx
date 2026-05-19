import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { HostHeader } from "./_home/host-header";
import { MeetingCard } from "./_home/meeting-card";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미들웨어가 보호하므로 여기 도달 시점에 user는 존재하지만 안전망
  if (!user) return null;

  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, date_range_start, date_range_end, confirmed_date")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  const hasMeetings = !!meetings && meetings.length > 0;

  return (
    <main className="flex h-[100dvh] flex-col bg-canvas">
      <HostHeader />

      <section className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-md px-4 py-6">
          {hasMeetings ? (
            <div className="grid grid-cols-2 gap-3">
              {meetings.map((m) => (
                <MeetingCard key={m.id} meeting={m} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>

      <footer className="shrink-0 border-t border-hairline-soft bg-canvas">
        <div
          className="mx-auto w-full max-w-md px-4 pt-4"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
        >
          <Link
            href="/new"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-deep px-6 py-4 text-base font-bold text-canvas transition active:bg-charcoal"
          >
            <Plus className="h-5 w-5" />
            <span>약속 만들기</span>
          </Link>
        </div>
      </footer>
    </main>
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
