import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { UpgradeContent } from "./upgrade-content";

export default async function UpgradePage(props: { params: Promise<{ id: string }> }) {
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

  return <UpgradeContent waitlist={waitlist} />;
}
