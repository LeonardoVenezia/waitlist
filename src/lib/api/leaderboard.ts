import { createAdminClient } from "@/lib/supabase/admin";

export interface LeaderboardEntry {
  position: number;
  email: string; // masked: j***@gmail.com
  referral_count: number;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
}

export async function getLeaderboard(
  waitlistId: string,
  limit = 5,
): Promise<LeaderboardEntry[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("subscribers")
    .select("id, email, referral_count")
    .eq("waitlist_id", waitlistId)
    .eq("status", "active")
    .order("referral_count", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (!data) return [];

  return data.map((entry, index) => ({
    position: index + 1,
    email: maskEmail(entry.email),
    referral_count: entry.referral_count,
  }));
}
