"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function assertOwnsWaitlist(waitlistId: string) {
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", waitlistId)
    .maybeSingle();
  if (!project) throw new Error("Not found");
}

export async function deleteSubscriber(id: string) {
  const supabase = await createClient();
  // Resolve waitlist + verify ownership via RLS-protected read
  const { data: sub } = await supabase
    .from("subscribers")
    .select("waitlist_id")
    .eq("id", id)
    .maybeSingle();
  if (!sub) return;

  const admin = createAdminClient();
  const { error } = await admin.from("subscribers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects/[id]/subscribers", "page");
}

export async function verifyAllSubscribers(waitlistId: string) {
  await assertOwnsWaitlist(waitlistId);

  const admin = createAdminClient();
  const { error } = await admin
    .from("subscribers")
    .update({ verified: true })
    .eq("waitlist_id", waitlistId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects/[id]/subscribers", "page");
}
