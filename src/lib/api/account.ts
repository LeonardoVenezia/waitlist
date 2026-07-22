import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getAccountId(userId: string): Promise<string | null> {
  const supabase = await createClient();

  // Try accounts first (simplest RLS policy)
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

  // Last resort: bypass RLS with admin client (new user, edge case)
  const admin = createAdminClient();
  const { data: adminAccount } = await admin
    .from("accounts")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  return adminAccount?.id ?? null;
}
