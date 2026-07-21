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
    .from("waitlists")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!waitlist) notFound();

  return <SettingsForm waitlist={waitlist} />;
}
