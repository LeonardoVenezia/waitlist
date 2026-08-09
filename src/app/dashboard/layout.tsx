import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserNav } from "@/components/dashboard/user-nav";

async function ensureAccount(userId: string): Promise<string> {
  const supabase = await createClient();

  // Try existing account first
  const { data: account } = await supabase
    .from("accounts")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (account) return account.id;

  // Fallback: account_members
  const { data: member } = await supabase
    .from("account_members")
    .select("account_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (member) return member.account_id;

  // User was created before handle_new_user trigger was deployed — create now
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  const admin = createAdminClient();

  // Ensure profile exists
  if (!profile) {
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email ?? "unknown";
    const name = authUser?.user?.user_metadata?.full_name ?? email.split("@")[0];
    await admin.from("profiles").insert({ id: userId, email, full_name: name });
  }

  const userName = profile?.email?.split("@")[0] ?? "User";

  // Create account + membership
  const { data: newAccount } = await admin
    .from("accounts")
    .insert({ owner_id: userId, name: userName })
    .select("id")
    .single();

  if (newAccount) {
    await admin
      .from("account_members")
      .insert({ account_id: newAccount.id, user_id: userId, role: "owner" });
    return newAccount.id;
  }

  throw new Error("Could not create account");
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const accountId = await ensureAccount(user.id);

  const [{ data: profile }, { data: projects }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("projects")
      .select("id, name, slug, plan")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="flex h-screen">
      <Sidebar projects={projects ?? []} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-12 items-center justify-end border-b px-8">
          <UserNav
            email={user.email!}
            fullName={profile?.full_name ?? null}
          />
        </header>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
