import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { AnalyticsClient } from "./analytics-client";

export default async function AnalyticsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: waitlist } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (!waitlist) notFound();

  // Subscriber stats
  const [{ count: total }, { count: verified }, { count: referred }] = await Promise.all([
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("waitlist_id", id).eq("status", "active"),
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("waitlist_id", id).eq("verified", true),
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("waitlist_id", id).gt("referral_count", 0),
  ]);

  // Page events (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [{ data: views }, { data: signups }] = await Promise.all([
    supabase.from("page_events").select("created_at").eq("waitlist_id", id).eq("type", "view").gte("created_at", thirtyDaysAgo.toISOString()).order("created_at"),
    supabase.from("page_events").select("created_at").eq("waitlist_id", id).eq("type", "signup").gte("created_at", thirtyDaysAgo.toISOString()).order("created_at"),
  ]);

  // Aggregate by day for chart
  const chartData = buildChartData(views ?? [], signups ?? []);

  // Overall page stats
  const [{ count: totalViews }, { count: pageSignups }] = await Promise.all([
    supabase.from("page_events").select("*", { count: "exact", head: true }).eq("waitlist_id", id).eq("type", "view"),
    supabase.from("page_events").select("*", { count: "exact", head: true }).eq("waitlist_id", id).eq("type", "signup"),
  ]);

  return (
    <AnalyticsClient
      stats={{
        total: total ?? 0,
        verified: verified ?? 0,
        referred: referred ?? 0,
        pageViews: totalViews ?? 0,
        pageSignups: pageSignups ?? 0,
        conversionRate: totalViews && totalViews > 0
          ? Math.round(((pageSignups ?? 0) / totalViews) * 1000) / 10
          : null,
      }}
      chartData={chartData}
    />
  );
}

function buildChartData(views: { created_at: string }[], signups: { created_at: string }[]) {
  const map = new Map<string, { views: number; signups: number }>();

  function addDate(dateStr: string, type: "views" | "signups") {
    const d = dateStr.split("T")[0];
    if (!map.has(d)) map.set(d, { views: 0, signups: 0 });
    const entry = map.get(d)!;
    entry[type]++;
  }

  views.forEach((v) => addDate(v.created_at, "views"));
  signups.forEach((s) => addDate(s.created_at, "signups"));

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views: data.views,
      signups: data.signups,
    }));
}
