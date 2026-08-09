import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: waitlist } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!waitlist) notFound();

  // Fetch team members
  const { data: members } = await supabase
    .from("account_members")
    .select("id, user_id, role, profiles(email, full_name)")
    .eq("account_id", waitlist.account_id)
    .order("role");

  return <SettingsForm project={waitlist} members={members ?? []} />;
}
