import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SubscribersTable } from "./subscribers-table";

export default async function SubscribersPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, name, submission_limit")
    .eq("id", id)
    .maybeSingle();

  if (!waitlist) notFound();

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("*")
    .eq("waitlist_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);

  const { count: hiddenCount } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("waitlist_id", id)
    .eq("status", "hidden");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Subscribers</h1>
          <p className="text-sm text-muted-foreground">
            {waitlist.name} — {subscribers?.length ?? 0} active
            {hiddenCount ? ` (${hiddenCount} hidden)` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/waitlists/${id}/export`}>
            <Button variant="outline" size="sm">Export</Button>
          </Link>
          <Link href={`/dashboard/waitlists/${id}/upgrade`}>
            <Button size="sm">Upgrade plan</Button>
          </Link>
        </div>
      </div>
      <SubscribersTable
        subscribers={subscribers ?? []}
        hiddenCount={hiddenCount ?? 0}
        waitlistId={id}
      />
    </div>
  );
}
