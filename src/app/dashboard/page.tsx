import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Find first waitlist or suggest creating one
  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, name, slug, plan, submission_limit")
    .limit(1)
    .maybeSingle();

  if (!waitlist) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-semibold">Welcome to Waitlist</h2>
        <p className="text-muted-foreground">
          Create your first waitlist to get started.
        </p>
        <Link href="/dashboard/waitlists/new">
          <Button>Create waitlist</Button>
        </Link>
      </div>
    );
  }

  redirect(`/dashboard/waitlists/${waitlist.id}`);
}
