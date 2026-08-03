"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/supabase/types";

type Json = Database["public"]["Tables"]["waitlists"]["Row"]["settings"];

export async function savePageSections(
  waitlistId: string,
  sections: unknown,
  global: unknown,
) {
  const supabase = createAdminClient();

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("settings")
    .eq("id", waitlistId)
    .single();

  if (!waitlist) return { error: "Not found" };

  const current = (waitlist.settings as Record<string, unknown>) ?? {};
  const updated = {
    ...current,
    page_sections: { sections, global },
  } as Json;

  const { error } = await supabase
    .from("waitlists")
    .update({ settings: updated })
    .eq("id", waitlistId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/waitlists/${waitlistId}/page-builder`);
  return { success: true };
}
