import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type ShowcaseAdmin = SupabaseClient<Database>;

export function getPlanPriority(plan?: string | null): number {
  if (plan === "grow") return 0;
  if (plan === "launch") return 1;
  return 2;
}

export async function buildPlanMap(
  admin: ShowcaseAdmin,
  waitlistIds: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(waitlistIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { data } = await admin
    .from("projects")
    .select("id, plan")
    .in("id", unique);

  return new Map((data ?? []).map((p) => [p.id, p.plan]));
}

export function sortShowcases<
  T extends {
    waitlist_id?: string | null;
    published_at?: string | null;
    created_at?: string | null;
  },
>(items: T[], planMap: Map<string, string>): T[] {
  return [...items].sort((a, b) => {
    const pa = getPlanPriority(a.waitlist_id ? planMap.get(a.waitlist_id) : undefined);
    const pb = getPlanPriority(b.waitlist_id ? planMap.get(b.waitlist_id) : undefined);
    if (pa !== pb) return pa - pb;

    const daRaw = a.published_at ?? a.created_at;
    const dbRaw = b.published_at ?? b.created_at;
    const da = daRaw ? new Date(daRaw).getTime() : 0;
    const db = dbRaw ? new Date(dbRaw).getTime() : 0;
    return db - da;
  });
}
