"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { getThankYouExperience } from "@/lib/thank-you-experiences";
import type { Database } from "@/lib/supabase/types";

type Json = Database["public"]["Tables"]["projects"]["Row"]["settings"];

/**
 * Writes only `settings.thank_you`.
 *
 * This section owns its own form, so unlike the tabbed Settings page it cannot
 * clobber other sections by rebuilding them from absent fields.
 */
export async function saveThankYouSettings(
  waitlistId: string,
  slug: string,
  thankYou: Record<string, unknown>,
) {
  const admin = createAdminClient();

  const { data: project } = await admin
    .from("projects")
    .select("plan, settings")
    .eq("id", waitlistId)
    .single();

  if (!project) return { error: "Not found" };

  const current = (project.settings as Record<string, unknown>) ?? {};

  // The accent is owner-configurable and the plan gates "hide powered by", so
  // neither the experience id nor that flag is trusted from the client.
  const next: Record<string, unknown> = {
    ...thankYou,
    experience: getThankYouExperience(thankYou.experience)?.id ?? "classic",
  };
  if ((project.plan as string) !== "launch") {
    next.hide_branding = false;
  }

  const { error } = await admin
    .from("projects")
    .update({ settings: { ...current, thank_you: next } as Json })
    .eq("id", waitlistId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/projects/${waitlistId}/thank-you`);
  revalidatePath(`/p/${slug}`, "page");
  return { success: true };
}
