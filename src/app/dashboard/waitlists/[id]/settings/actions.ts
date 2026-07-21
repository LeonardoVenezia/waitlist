"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/supabase/types";

type Settings = Database["public"]["Tables"]["waitlists"]["Row"]["settings"];

export async function updateWaitlistSettings(
  waitlistId: string,
  prevState: unknown,
  formData: FormData,
) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;

  // Build settings from form fields
  const settings: Settings = {
    branding: {
      logo_url: formData.get("branding.logo_url") as string || null,
      primary_color: (formData.get("branding.primary_color") as string) || "#22c563",
      font: formData.get("branding.font") as string || null,
    },
    hero: {
      title: (formData.get("hero.title") as string) || "",
      subtitle: (formData.get("hero.subtitle") as string) || "",
      cta_label: (formData.get("hero.cta_label") as string) || "Join the waitlist",
    },
    form: {
      fields: [{ name: "email", type: "email", required: true }],
      collect_name: formData.get("form.collect_name") === "on",
    },
    thank_you: {
      message: (formData.get("thank_you.message") as string) || "",
      show_position: formData.get("thank_you.show_position") !== "off",
      show_referral_link: formData.get("thank_you.show_referral_link") !== "off",
      show_leaderboard: formData.get("thank_you.show_leaderboard") !== "off",
    },
    referral: {
      enabled: formData.get("referral.enabled") !== "off",
      positions_per_referral: Number(formData.get("referral.positions_per_referral")) || 10,
      starting_position_offset: Number(formData.get("referral.starting_position_offset")) || 0,
      reward_text: (formData.get("referral.reward_text") as string) || "",
      milestones: [],
    },
    notifications: {
      email_on_signup: formData.get("notifications.email_on_signup") !== "off",
      slack_webhook_url: formData.get("notifications.slack_webhook_url") as string || null,
      welcome_email: formData.get("notifications.welcome_email") === "on",
    },
    language: (formData.get("language") as string) || "en",
    remove_branding: formData.get("remove_branding") === "on",
  };

  const { error } = await supabase
    .from("waitlists")
    .update({ name, slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ""), settings })
    .eq("id", waitlistId);

  if (error) {
    if (error.code === "23505") {
      return { error: "This slug is already taken" };
    }
    return { error: error.message };
  }

  revalidatePath(`/dashboard/waitlists/${waitlistId}/settings`);
  return { success: true };
}
