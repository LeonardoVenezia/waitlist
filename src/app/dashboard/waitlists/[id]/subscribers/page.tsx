import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SubscribersTable } from "./subscribers-table";

const PAGE_SIZE = 25;

export default async function SubscribersPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const pageNum = Math.max(0, Number(sp?.page ?? 1) - 1);

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

  const from = pageNum * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [{ data: subscribers, count: totalCount }, { count: hiddenCount }] =
    await Promise.all([
      supabase
        .from("subscribers")
        .select("*", { count: "exact", head: false })
        .eq("waitlist_id", id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .range(from, to),
      supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .eq("waitlist_id", id)
        .eq("status", "hidden"),
    ]);

  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Subscribers</h1>
          <p className="text-sm text-muted-foreground">
            {waitlist.name} — {totalCount ?? 0} active
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
        page={pageNum}
        totalPages={totalPages}
      />
    </div>
  );
}
