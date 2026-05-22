import { createClient } from "@/lib/supabase/server";
import { HostHome } from "./_home/host-home";
import { LandingHome } from "./_home/landing-home";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LandingHome />;
  }

  const { data: meetings } = await supabase
    .from("meetings")
    .select(
      "id, title, date_range_start, date_range_end, confirmed_date, participants(count)",
    )
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  const mapped = (meetings ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    date_range_start: m.date_range_start,
    date_range_end: m.date_range_end,
    confirmed_date: m.confirmed_date,
    participantCount: m.participants?.[0]?.count ?? 0,
  }));

  return <HostHome meetings={mapped} />;
}
