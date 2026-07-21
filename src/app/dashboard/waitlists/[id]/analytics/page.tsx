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

  // Basic analytics
  const { count: total } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("waitlist_id", id);

  const { count: verified } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("waitlist_id", id)
    .eq("verified", true);

  const { count: referred } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("waitlist_id", id)
    .gt("referral_count", 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{verified ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Made a referral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{referred ?? 0}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
