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
          <Link href={`/dashboard/waitlists/${id}/settings`}>
            <Button variant="outline" size="sm">Settings</Button>
          </Link>
          <Link href={`/dashboard/waitlists/${id}/embed`}>
            <Button variant="outline" size="sm">Embed</Button>
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCount ?? 0}</p>
          </CardContent>
        </Card>
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
