"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteSubscriber(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("subscribers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects/[id]/subscribers", "page");
}

export async function verifyAllSubscribers(waitlistId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("subscribers")
    .update({ verified: true })
    .eq("waitlist_id", waitlistId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects/[id]/subscribers", "page");
}
