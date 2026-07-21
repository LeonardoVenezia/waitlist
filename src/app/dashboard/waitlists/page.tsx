import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function WaitlistsPage() {
  const supabase = await createClient();

  const { data: waitlists } = await supabase
    .from("waitlists")
    .select("id")
    .limit(1);

  if (waitlists && waitlists.length > 0) {
    redirect(`/dashboard/waitlists/${waitlists[0].id}`);
  }

  redirect("/dashboard/waitlists/new");
}
