import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccountId } from "@/lib/api/account";
import { CreateWaitlistForm } from "./create-waitlist-form";

export default async function NewWaitlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const accountId = await getAccountId(user.id);
  if (!accountId) redirect("/login");

  return <CreateWaitlistForm accountId={accountId} />;
}
