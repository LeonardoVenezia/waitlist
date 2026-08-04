"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Thank You Page
  const thankYou = {
    message: formData.get("thank_you.message") as string || "",
    show_position: formData.get("thank_you.show_position") !== "off",
    show_referral_link: formData.get("thank_you.show_referral_link") !== "off",
    show_leaderboard: formData.get("thank_you.show_leaderboard") !== "off",
    title: formData.get("thank_you.title") as string || "",
    subtitle: formData.get("thank_you.subtitle") as string || "",
    description: formData.get("thank_you.description") as string || "",
    position_text: formData.get("thank_you.position_text") as string || "",
    referred_text: formData.get("thank_you.referred_text") as string || "",
    social_message: formData.get("thank_you.social_message") as string || "",
    social_buttons: formData.getAll("thank_you.social_buttons") as string[],
    brand_color: formData.get("thank_you.brand_color") as string || "#0ea5e9",
    cta_label: formData.get("thank_you.cta_label") as string || "",
    cta_url: formData.get("thank_you.cta_url") as string || "",
    hide_confetti: formData.get("thank_you.hide_confetti") === "on",
    hide_referral: formData.get("thank_you.hide_referral") === "on",
    hide_branding: formData.get("thank_you.hide_branding") === "on",
    hide_until_verified: formData.get("thank_you.hide_until_verified") === "on",
    tracking_code: formData.get("thank_you.tracking_code") as string || "",
    social_twitter: formData.get("thank_you.social_twitter") as string || "",
    social_instagram: formData.get("thank_you.social_instagram") as string || "",
    social_threads: formData.get("thank_you.social_threads") as string || "",
    social_linkedin: formData.get("thank_you.social_linkedin") as string || "",
    social_facebook: formData.get("thank_you.social_facebook") as string || "",
    social_reddit: formData.get("thank_you.social_reddit") as string || "",
    social_telegram: formData.get("thank_you.social_telegram") as string || "",
    social_whatsapp: formData.get("thank_you.social_whatsapp") as string || "",
    social_tiktok: formData.get("thank_you.social_tiktok") as string || "",
    social_youtube: formData.get("thank_you.social_youtube") as string || "",
    social_discord: formData.get("thank_you.social_discord") as string || "",
  };

  // Submissions
  const initialPosition = Number(formData.get("submissions.initial_position")) || 0;
  const positionToMove = Number(formData.get("submissions.position_to_move")) || 10;

  // Email
  const emailSettings = {
    welcome_email: formData.get("email.welcome_email") === "on",
    welcome_subject: formData.get("email.welcome_subject") as string || "",
    welcome_message: formData.get("email.welcome_message") as string || "",
    hide_welcome_cta: formData.get("email.hide_welcome_cta") === "on",
    customize_welcome_cta: formData.get("email.customize_welcome_cta") === "on",
    welcome_cta_url: formData.get("email.welcome_cta_url") as string || "",
    welcome_after_verification: formData.get("email.welcome_after_verification") === "on",
    verify_email: formData.get("email.verify_email") === "on",
    verify_message: formData.get("email.verify_message") as string || "",
    signature: formData.get("email.signature") as string || "",
    reply_to_name: formData.get("email.reply_to_name") as string || "",
    reply_to_email: formData.get("email.reply_to_email") as string || "",
    sender_domain: formData.get("email.sender_domain") as string || "default",
  };

  // Notifications
  const notifications = {
    email_on_signup: formData.get("notifications.email_on_signup") !== "off",
    slack_webhook_url: formData.get("notifications.slack_webhook_url") as string || null,
  };

  // Block list
  const blockedEmails = formData.get("blocked_emails") as string || "";

  // Build settings preserving existing data
  const { data: current } = await supabase
    .from("waitlists")
    .select("settings")
    .eq("id", waitlistId)
    .single();

  const existing = (current?.settings as Record<string, unknown>) ?? {};

  const settings = {
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
    thank_you: thankYou,
    referral: {
      enabled: formData.get("referral.enabled") !== "off",
      positions_per_referral: positionToMove,
      starting_position_offset: initialPosition,
      reward_text: (formData.get("referral.reward_text") as string) || "",
      milestones: parseMilestones(formData.get("referral.milestones") as string),
    },
    notifications,
    email: emailSettings,
    blocked_emails: blockedEmails ? blockedEmails.split(",").map((e: string) => e.trim()).filter(Boolean) : [],
    language: (formData.get("language") as string) || "en",
    remove_branding: formData.get("remove_branding") === "on",
    widget: existing.widget,
    page_sections: existing.page_sections,
    leaderboard: existing.leaderboard,
  } as unknown as Settings;

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

// ── Team actions ──

export async function inviteTeamMember(waitlistId: string, formData: FormData) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const email = formData.get("email") as string;
  const role = (formData.get("role") as string) || "member";
  if (!email) return { error: "Email is required" };

  // Find user by email
  const { data: profiles } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .limit(1);

  if (!profiles || profiles.length === 0) {
    return { error: "No user found with that email" };
  }

  // Get account_id for this waitlist
  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("account_id")
    .eq("id", waitlistId)
    .single();

  if (!waitlist) return { error: "Waitlist not found" };

  const { error } = await admin
    .from("account_members")
    .insert({
      account_id: waitlist.account_id,
      user_id: profiles[0].id,
      role: role as "owner" | "admin" | "member",
    });

  if (error) {
    if (error.code === "23505") return { error: "User is already a member" };
    return { error: error.message };
  }

  revalidatePath(`/dashboard/waitlists/${waitlistId}/settings`);
  return { success: true };
}

export async function removeTeamMember(waitlistId: string, memberId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("account_members").delete().eq("id", memberId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/waitlists/${waitlistId}/settings`);
  return { success: true };
}

function parseMilestones(raw: string | null): Array<{ count: number; reward: string }> {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((m: { count: number; reward: string }) => m.count > 0 && m.reward);
    return [];
  } catch {
    return [];
  }
}
