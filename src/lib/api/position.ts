import { createAdminClient } from "@/lib/supabase/admin";

export async function getSubscriberPosition(subscriberId: string): Promise<number | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .rpc("get_position", { p_subscriber_id: subscriberId });

  if (error || data === null || data === undefined) {
    return null;
  }

  return data as number;
}

export async function getSubscriberCount(waitlistId: string): Promise<number> {
  const supabase = createAdminClient();

  const { count } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("waitlist_id", waitlistId)
    .eq("status", "active");

  return count ?? 0;
}
