import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateWaitlistForm } from "./create-waitlist-form";

export default async function NewWaitlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get the user's account
  const { data: member } = await supabase
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) redirect("/login");

  return <CreateWaitlistForm accountId={member.account_id} />;
}
