import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccountId } from "@/lib/api/account";
import { CreateProjectForm } from "./create-project-form";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const accountId = await getAccountId(user.id);
  if (!accountId) redirect("/login");

  return <CreateProjectForm accountId={accountId} />;
}
