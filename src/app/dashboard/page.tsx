import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getAccountId } from "@/lib/api/account";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const accountId = await getAccountId(user.id);

  if (!accountId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 max-w-sm mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-2xl">
          🎯
        </div>
        <h1 className="text-2xl">Welcome to [PACK]</h1>
        <p className="text-sm text-muted-foreground">
          Create your first project to get started with waitlists, coming-soon pages, and more.
        </p>
        <Link href="/dashboard/waitlists/new">
          <Button size="lg">Create your first project</Button>
        </Link>
      </div>
    );
  }

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, name, slug, plan, submission_limit")
    .eq("account_id", accountId)
    .limit(1)
    .maybeSingle();

  if (!waitlist) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 max-w-sm mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-2xl">
          🎯
        </div>
        <h1 className="text-2xl">Welcome to [PACK]</h1>
        <p className="text-sm text-muted-foreground">
          Create your first project to get started with waitlists, coming-soon pages, and more.
        </p>
        <Link href="/dashboard/waitlists/new">
          <Button size="lg">Create your first project</Button>
        </Link>
      </div>
    );
  }

  redirect(`/dashboard/waitlists/${waitlist.id}`);
}
