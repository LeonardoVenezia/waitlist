import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AnalyticsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (!waitlist) notFound();

  const [{ count: total }, { count: verified }, { count: referred }] = await Promise.all([
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("waitlist_id", id),
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("waitlist_id", id).eq("verified", true),
    supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("waitlist_id", id).gt("referral_count", 0),
  ]);

  const hasData = (total ?? 0) > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Analytics</h1>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-lg mb-4">
            📊
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            No data yet. Analytics will appear here once subscribers start signing up.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total signups</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl">{total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl">{verified}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Made a referral</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl">{referred}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
