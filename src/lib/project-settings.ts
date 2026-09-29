import { BRAND_ACCENT_OKLCH } from "@/lib/brand";

/**
 * Builds the `projects.settings` JSONB from a Settings form submission.
 *
 * The Settings page renders its tabs **conditionally**, so a submit only
 * carries the fields of the active tab. Every section therefore has to be
 * rebuilt only when its own tab is the one being saved, and preserved from the
 * stored row otherwise — rebuilding from absent fields silently reset the
 * section (this was the bug: only `email` was guarded).
 *
 * Sessions that no longer have a tab of their own (`thank_you`, which moved to
 * its own dashboard section, plus `form` and `remove_branding`, which have no
 * UI at all) are always preserved.
 *
 * Pure on purpose: this is the data-loss surface, so it is the one thing that
 * can be asserted headlessly with a real `FormData`.
 */
export function buildProjectSettings({
  current,
  formData,
  activeTab,
}: {
  current: Record<string, unknown>;
  formData: FormData;
  activeTab: string | null;
}): Record<string, unknown> {
  const existing = current ?? {};
  const isTab = (name: string) => activeTab === name;

  const text = (key: string): string => (formData.get(key) as string | null) ?? "";
  const record = (value: unknown): Record<string, unknown> =>
    (value ?? {}) as Record<string, unknown>;

  const branding = isTab("Branding")
    ? {
        logo_url: text("branding.logo_url") || null,
        primary_color: text("branding.primary_color") || BRAND_ACCENT_OKLCH,
        font: text("branding.font") || null,
      }
    : {
        logo_url: null,
        primary_color: BRAND_ACCENT_OKLCH,
        font: null,
        ...record(existing.branding),
      };

  const hero = isTab("Hero")
    ? {
        title: text("hero.title"),
        subtitle: text("hero.subtitle"),
        cta_label: text("hero.cta_label") || "Join the waitlist",
      }
    : {
        title: "",
        subtitle: "",
        cta_label: "Join the waitlist",
        ...record(existing.hero),
      };

  // Referral settings live in the Submissions tab.
  const referral = isTab("Submissions")
    ? {
        enabled: formData.get("referral.enabled") !== "off",
        positions_per_referral: Number(formData.get("submissions.position_to_move")) || 10,
        starting_position_offset: Number(formData.get("submissions.initial_position")) || 0,
        reward_text: text("referral.reward_text"),
        milestones: parseMilestones(formData.get("referral.milestones") as string | null),
      }
    : {
        enabled: true,
        positions_per_referral: 10,
        starting_position_offset: 0,
        reward_text: "",
        milestones: [],
        ...record(existing.referral),
      };

  const email = isTab("Email")
    ? buildEmailSettings(formData, record(existing.email))
    : record(existing.email);

  const notifications = isTab("Notifications")
    ? {
        email_on_signup: formData.get("notifications.email_on_signup") !== "off",
        slack_webhook_url: text("notifications.slack_webhook_url") || null,
      }
    : {
        email_on_signup: true,
        slack_webhook_url: null,
        ...record(existing.notifications),
      };

  const blockedEmails = isTab("Block")
    ? text("blocked_emails")
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean)
    : ((existing.blocked_emails as string[] | undefined) ?? []);

  const language = isTab("Branding")
    ? text("language") || "en"
    : ((existing.language as string | undefined) ?? "en");

  const postSignup = isTab("Post-signup")
    ? parsePostSignup(formData.get("post_signup") as string | null)
    : existing.post_signup;

  return {
    branding,
    hero,
    referral,
    notifications,
    email,
    blocked_emails: blockedEmails,
    language,
    post_signup: postSignup,
    // Owned by other dashboard surfaces now, or by nothing at all.
    thank_you: record(existing.thank_you),
    form: record(existing.form),
    remove_branding: existing.remove_branding === true,
    widget: existing.widget,
    page_sections: existing.page_sections,
    leaderboard: existing.leaderboard,
  };
}

/** The Email tab has per-field guards because its inputs are conditionally rendered too. */
function buildEmailSettings(
  formData: FormData,
  existingEmail: Record<string, unknown>,
): Record<string, unknown> {
  const hasText = (key: string, fallback: unknown) =>
    formData.has(key) ? (formData.get(key) as string) || "" : (fallback as string) ?? "";
  return {
    welcome_email: formData.has("email.welcome_email")
      ? formData.get("email.welcome_email") === "on"
      : existingEmail.welcome_email !== false,
    welcome_subject: hasText("email.welcome_subject", existingEmail.welcome_subject),
    welcome_message: hasText("email.welcome_message", existingEmail.welcome_message),
    hide_welcome_cta: formData.has("email.hide_welcome_cta")
      ? formData.get("email.hide_welcome_cta") === "on"
      : existingEmail.hide_welcome_cta === true,
    customize_welcome_cta: formData.has("email.customize_welcome_cta")
      ? formData.get("email.customize_welcome_cta") === "on"
      : existingEmail.customize_welcome_cta === true,
    welcome_cta_url: hasText("email.welcome_cta_url", existingEmail.welcome_cta_url),
    welcome_after_verification: formData.has("email.welcome_after_verification")
      ? formData.get("email.welcome_after_verification") === "on"
      : existingEmail.welcome_after_verification === true,
    verify_email: formData.has("email.verify_email")
      ? formData.get("email.verify_email") === "on"
      : existingEmail.verify_email !== false,
    verify_message: hasText("email.verify_message", existingEmail.verify_message),
    signature: hasText("email.signature", existingEmail.signature),
    reply_to_name: hasText("email.reply_to_name", existingEmail.reply_to_name),
    reply_to_email: hasText("email.reply_to_email", existingEmail.reply_to_email),
  };
}

function parseMilestones(raw: string | null): Array<{ count: number; reward: string }> {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (m: { count: number; reward: string }) => m.count > 0 && m.reward,
      );
    }
    return [];
  } catch {
    return [];
  }
}

function parsePostSignup(raw: string | null): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
