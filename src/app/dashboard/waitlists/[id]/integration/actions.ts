"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/supabase/types";

type Json = Database["public"]["Tables"]["waitlists"]["Row"]["settings"];

export async function updateWidgetSettings(
  waitlistId: string,
  widgetSettings: Record<string, unknown>,
) {
  const supabase = createAdminClient();

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("settings")
    .eq("id", waitlistId)
    .single();

  if (!waitlist) return { error: "Waitlist not found" };

  const currentSettings = (waitlist.settings as Record<string, unknown>) ?? {};
  const updatedSettings = { ...currentSettings, widget: widgetSettings } as Json;

  const { error } = await supabase
    .from("waitlists")
    .update({ settings: updatedSettings })
    .eq("id", waitlistId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/waitlists/${waitlistId}/integration`);
  return { success: true };
}

export async function updateLeaderboardSettings(
  waitlistId: string,
  leaderboardSettings: Record<string, unknown>,
) {
  const supabase = createAdminClient();

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("settings")
    .eq("id", waitlistId)
    .single();

  if (!waitlist) return { error: "Waitlist not found" };

  const currentSettings = (waitlist.settings as Record<string, unknown>) ?? {};
  const updatedSettings = { ...currentSettings, leaderboard: leaderboardSettings } as Json;

  const { error } = await supabase
    .from("waitlists")
    .update({ settings: updatedSettings })
    .eq("id", waitlistId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/waitlists/${waitlistId}/integration`);
  return { success: true };
}
