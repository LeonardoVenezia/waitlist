import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function WaitlistDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!waitlist) notFound();

  const { count: activeCount } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("waitlist_id", id)
    .eq("status", "active");

  const { count: hiddenCount } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("waitlist_id", id)
    .eq("status", "hidden");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{waitlist.name}</h1>
          <p className="text-sm text-muted-foreground">/p/{waitlist.slug}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/waitlists/${id}/subscribers`}>
            <Button size="sm">Subscribers</Button>
          </Link>
          <Link href={`/dashboard/waitlists/${id}/analytics`}>
            <Button variant="outline" size="sm">Analytics</Button>
          </Link>
          <Link href={`/dashboard/waitlists/${id}/settings`}>
            <Button variant="outline" size="sm">Settings</Button>
          </Link>
        </div>
      </div>

      {hiddenCount && hiddenCount > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {hiddenCount} subscriber{hiddenCount === 1 ? "" : "s"} hidden —{" "}
          <Link href={`/dashboard/waitlists/${id}/upgrade`} className="font-medium underline">
            upgrade your plan
          </Link>{" "}
          to see them.
        </div>
      ) : null}

      {/* Navigation tabs */}
      <nav className="flex gap-1 border-b">
        <Link
          href={`/dashboard/waitlists/${id}/subscribers`}
          className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Subscribers
        </Link>
        <Link
          href={`/dashboard/waitlists/${id}/analytics`}
          className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Analytics
        </Link>
        <Link
          href={`/dashboard/waitlists/${id}/export`}
          className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Export
        </Link>
        <Link
          href={`/dashboard/waitlists/${id}/embed`}
          className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Embed
        </Link>
        <Link
          href={`/dashboard/waitlists/${id}/settings`}
          className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Settings
        </Link>
        <Link
          href={`/dashboard/waitlists/${id}/upgrade`}
          className="px-3 py-2 text-sm font-medium text-primary hover:text-primary/80"
        >
          Upgrade
        </Link>
      </nav>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href={`/dashboard/waitlists/${id}/subscribers`}>
          <Card className="transition-colors hover:bg-accent/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Subscribers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activeCount ?? 0}</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{waitlist.plan}</p>
            <p className="text-xs text-muted-foreground">
              {waitlist.submission_limit
                ? `${waitlist.submission_limit} max`
                : "Unlimited"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Referral link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground break-all">
              {process.env.NEXT_PUBLIC_APP_URL}/p/{waitlist.slug}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
