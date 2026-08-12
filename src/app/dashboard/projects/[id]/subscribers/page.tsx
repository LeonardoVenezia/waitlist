import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SubscribersTable } from "./subscribers-table";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function SubscribersPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    page?: string;
    search?: string;
    verified?: string;
    date_from?: string;
    date_until?: string;
    email_status?: string;
  }>;
}) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const pageNum = Math.max(0, Number(sp?.page ?? 1) - 1);
  const search = sp?.search ?? "";
  const verified = sp?.verified ?? "";
  const dateFrom = sp?.date_from ?? "";
  const dateUntil = sp?.date_until ?? "";
  const emailStatus = sp?.email_status ?? "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: waitlist } = await supabase
    .from("projects")
    .select("id, name, submission_limit, plan")
    .eq("id", id)
    .maybeSingle();

  if (!waitlist) notFound();

  let query = supabase
    .from("subscribers")
    .select("*", { count: "exact", head: false })
    .eq("waitlist_id", id)
    .eq("status", "active");

  if (search) {
    query = query.ilike("email", `%${search}%`);
  }
  if (verified === "verified") {
    query = query.eq("verified", true);
  } else if (verified === "unverified") {
    query = query.eq("verified", false);
  }
  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }
  if (dateUntil) {
    const untilEnd = dateUntil + "T23:59:59.999Z";
    query = query.lte("created_at", untilEnd);
  }
  if (emailStatus) {
    query = query.eq("email_status", emailStatus);
  }

  const from = pageNum * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [{ data: subscribers, count: totalCount }, { count: hiddenCount }] =
    await Promise.all([
      query.order("created_at", { ascending: false }).range(from, to),
      supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .eq("waitlist_id", id)
        .eq("status", "hidden"),
    ]);

  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE);

  // Build export link with current filters
  const exportParams = new URLSearchParams();
  if (search) exportParams.set("search", search);
  if (verified) exportParams.set("verified", verified);
  if (dateFrom) exportParams.set("date_from", dateFrom);
  if (dateUntil) exportParams.set("date_until", dateUntil);
  if (emailStatus) exportParams.set("email_status", emailStatus);
  const exportQs = exportParams.toString();

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
          <Link href={`/dashboard/projects/${id}/export${exportQs ? "?" + exportQs : ""}`}>
            <Button variant="outline" size="sm">Export</Button>
          </Link>
          <Link href={`/dashboard/projects/${id}/upgrade`}>
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
        totalCount={totalCount ?? 0}
        pageSize={PAGE_SIZE}
        filters={{ search, verified, dateFrom, dateUntil, emailStatus }}
      />
    </div>
  );
}
