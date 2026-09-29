import { BRAND_ACCENT_OKLCH } from "@/lib/brand";
import { contrastTextOn, toHexColor } from "@/lib/color";

/**
 * Post-signup experiences: the screen a visitor sees AFTER submitting their
 * email. A surface of its own — it is not a landing template (it has no
 * thumbnail in the page-builder picker, no email palette, and it never drives
 * /p/[slug]'s look), so it gets its own registry following the same pattern as
 * `templates.ts` rather than sharing `TemplateId`.
 *
 * Everything the screen computes lives here as pure functions, because the
 * post-signup state only exists client-side after a submit: the HTML never
 * contains it, so this module is the only place it can be verified.
 */

export interface Milestone {
  count: number;
  reward: string;
}

export type ThankYouExperienceId = "classic" | "embajadores";

export interface ThankYouExperienceDefinition {
  id: ThankYouExperienceId;
  name: string;
  description: string;
  /** Selector card styling, same idiom as the landing template picker. */
  thumbnail: { bg: string; text: string };
}

export const THANK_YOU_EXPERIENCES: Record<
  ThankYouExperienceId,
  ThankYouExperienceDefinition
> = {
  classic: {
    id: "classic",
    name: "Classic",
    description: "The post-signup screen that ships with your landing template.",
    thumbnail: {
      bg: "bg-white border-b border-zinc-200",
      text: "text-zinc-900",
    },
  },
  embajadores: {
    id: "embajadores",
    name: "Embajadores",
    description: "Referral hub: queue position, share buttons and progress to rewards.",
    thumbnail: {
      bg: "bg-gradient-to-br from-amber-100 via-rose-100 to-violet-100",
      text: "text-zinc-900",
    },
  },
};

export function getThankYouExperience(
  id: unknown,
): ThankYouExperienceDefinition | null {
  if (typeof id !== "string") return null;
  if (!(id in THANK_YOU_EXPERIENCES)) return null;
  return THANK_YOU_EXPERIENCES[id as ThankYouExperienceId];
}

// ── Config ─────────────────────────────────────────────

export interface ThankYouConfig {
  experience: ThankYouExperienceId;
  language: string;
  /** Copy from the builder; empty means "use the built-in default". */
  title: string;
  subtitle: string;
  message: string;
  logoUrl: string | null;
  accent: string;
  /** Computed, never a fixed white: the accent is owner-configurable. */
  accentText: string;
  socialMessage: string;
  socialButtons: string[];
}

export const DEFAULT_THANK_YOU_CONFIG: ThankYouConfig = {
  experience: "classic",
  language: "en",
  title: "",
  subtitle: "",
  message: "",
  logoUrl: null,
  accent: BRAND_ACCENT_OKLCH, // keep in sync with --primary in globals.css
  accentText: "#FFFFFF",
  socialMessage: "",
  socialButtons: [],
};

function asRecord(value: unknown): Record<string, unknown> {
  return (value ?? {}) as Record<string, unknown>;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Normalizes the settings that drive the post-signup screen. Wakes up two
 * fields that were saved but never read anywhere: `thank_you.brand_color` and
 * `settings.language`.
 */
export function resolveThankYouConfig(
  settings: Record<string, unknown>,
): ThankYouConfig {
  const thankYou = asRecord(settings.thank_you);
  const branding = asRecord(settings.branding);

  const accent =
    asText(thankYou.brand_color) ||
    asText(branding.primary_color) ||
    DEFAULT_THANK_YOU_CONFIG.accent;
  const accentHex = toHexColor(accent);

  return {
    experience: getThankYouExperience(thankYou.experience)?.id ?? "classic",
    language: asText(settings.language) || DEFAULT_THANK_YOU_CONFIG.language,
    title: asText(thankYou.title),
    subtitle: asText(thankYou.subtitle),
    message: asText(thankYou.message),
    logoUrl: asText(branding.logo_url) || null,
    accent,
    accentText: accentHex ? contrastTextOn(accentHex) : "#FFFFFF",
    socialMessage: asText(thankYou.social_message),
    socialButtons: Array.isArray(thankYou.social_buttons)
      ? thankYou.social_buttons.filter((s): s is string => typeof s === "string")
      : [],
  };
}

// ── Milestones ─────────────────────────────────────────

/** The first one sits at 3 so the reward is reachable, not aspirational. */
const DEFAULT_MILESTONE_COUNTS = [3, 10, 25];

export function defaultMilestones(language: string): Milestone[] {
  const l = thankYouLabels(language);
  return [
    { count: DEFAULT_MILESTONE_COUNTS[0], reward: l.rewardEarlyAccess },
    { count: DEFAULT_MILESTONE_COUNTS[1], reward: l.rewardFreeMonth },
    { count: DEFAULT_MILESTONE_COUNTS[2], reward: l.rewardMerch },
  ];
}

export function normalizeMilestones(value: unknown): Milestone[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (m): m is Milestone =>
        !!m &&
        typeof (m as Milestone).count === "number" &&
        (m as Milestone).count > 0 &&
        typeof (m as Milestone).reward === "string" &&
        (m as Milestone).reward.trim().length > 0,
    )
    .map((m) => ({ count: m.count, reward: m.reward.trim() }))
    .sort((a, b) => a.count - b.count);
}

export type MilestoneStatus = "earned" | "next" | "locked";

export interface MilestoneProgress {
  states: Array<Milestone & { status: MilestoneStatus; remaining: number }>;
  earned: number;
  /** 0..1 toward the next milestone; 1 when everything is unlocked. */
  progress: number;
  nextTarget: number | null;
}

export function milestoneStates(
  milestones: Milestone[],
  referralCount: number,
): MilestoneProgress {
  const sorted = [...milestones].sort((a, b) => a.count - b.count);
  const count = Math.max(0, referralCount);

  let nextSeen = false;
  const states = sorted.map((m) => {
    const earned = count >= m.count;
    let status: MilestoneStatus = "earned";
    if (!earned) {
      status = nextSeen ? "locked" : "next";
      nextSeen = true;
    }
    return { ...m, status, remaining: Math.max(0, m.count - count) };
  });

  const earned = states.filter((s) => s.status === "earned").length;
  const next = states.find((s) => s.status === "next") ?? null;
  const previousTarget = earned > 0 ? sorted[earned - 1].count : 0;

  const progress = next
    ? Math.min(
        1,
        Math.max(0, (count - previousTarget) / Math.max(1, next.count - previousTarget)),
      )
    : states.length > 0
      ? 1
      : 0;

  return { states, earned, progress, nextTarget: next?.count ?? null };
}

// ── Sharing ────────────────────────────────────────────

export const DEFAULT_SHARE_PLATFORMS = ["whatsapp", "x", "linkedin"];

/** Brand colors for the share buttons. Text on them is computed, never fixed. */
export const SHARE_PLATFORM_COLORS: Record<string, string> = {
  whatsapp: "#25D366",
  x: "#0B0B0F",
  linkedin: "#0A66C2",
  // Facebook's #1877F2 is a contrast dead zone: 4.23 with white, 4.45 with ink,
  // so neither text color clears AA on it. Slightly deepened.
  facebook: "#1668D6",
  telegram: "#229ED9",
  reddit: "#FF4500",
  email: "#3F3F46",
};

const PLATFORM_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  x: "X",
  twitter: "X",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  telegram: "Telegram",
  reddit: "Reddit",
  email: "Email",
};

export interface ShareLink {
  platform: string;
  label: string;
  url: string;
}

/**
 * Intent URLs for the platforms that have one. Anything else (threads,
 * instagram, tiktok, vk…) is skipped rather than rendered as a dead button.
 */
export function buildShareLinks({
  referralLink,
  message,
  platforms,
}: {
  referralLink: string;
  message?: string;
  platforms?: string[];
}): ShareLink[] {
  const link = referralLink.trim();
  if (!link) return [];
  const text = (message ?? "").trim();
  const wanted = (platforms && platforms.length > 0 ? platforms : DEFAULT_SHARE_PLATFORMS)
    .map((p) => p.toLowerCase().trim())
    .filter((p, i, all) => all.indexOf(p) === i);

  const enc = encodeURIComponent;
  const withText = text ? `${enc(text)}%20${enc(link)}` : enc(link);

  return wanted.flatMap((platform) => {
    const label = PLATFORM_LABELS[platform];
    if (!label) return [];
    switch (platform) {
      case "whatsapp":
        return [{ platform, label, url: `https://wa.me/?text=${withText}` }];
      case "x":
      case "twitter":
        return [
          {
            platform: "x",
            label,
            url: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(link)}`,
          },
        ];
      case "linkedin":
        return [
          {
            platform,
            label,
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(link)}`,
          },
        ];
      case "facebook":
        return [{ platform, label, url: `https://www.facebook.com/sharer.php?u=${enc(link)}` }];
      case "telegram":
        return [
          { platform, label, url: `https://t.me/share/url?url=${enc(link)}&text=${enc(text)}` },
        ];
      case "reddit":
        return [
          { platform, label, url: `https://www.reddit.com/submit?url=${enc(link)}&title=${enc(text)}` },
        ];
      case "email":
        return [
          { platform, label, url: `mailto:?subject=${enc(text)}&body=${enc(link)}` },
        ];
      default:
        return [];
    }
  });
}

// ── Copy ───────────────────────────────────────────────

const LOCALES: Record<string, string> = {
  en: "en-US",
  es: "es-AR",
  pt: "pt-BR",
  fr: "fr-FR",
  de: "de-DE",
};

/** Explicit locale so SSR and the client always agree. */
export function formatNumber(value: number, language: string): string {
  return new Intl.NumberFormat(LOCALES[language] ?? "en-US").format(value);
}

export interface PositionLine {
  prefix: string;
  position: string;
  suffix: string;
}

/** "Sos el" + "#482" + "de 2.314" — split so the number can be emphasized. */
export function formatPositionLine(
  position: number | null,
  total: number | null,
  language: string,
): PositionLine | null {
  if (position === null || position === undefined) return null;
  const es = language === "es";
  return {
    prefix: es ? "Sos el" : "You're",
    position: `#${formatNumber(position, language)}`,
    suffix:
      total && total > 0
        ? `${es ? "de" : "of"} ${formatNumber(total, language)}`
        : "",
  };
}

export function thankYouLabels(language: string) {
  const es = language === "es";
  return {
    confirmed: es ? "Estás adentro" : "You're in",
    confirmedMessage: es
      ? "Te guardamos el lugar. Cuantos más invites, más arriba quedás."
      : "Your spot is saved. The more you invite, the higher you climb.",
    positionNote: es
      ? "Cada referido te adelanta lugares en la fila."
      : "Every referral moves you up the line.",
    yourLink: es ? "Tu link para invitar" : "Your invite link",
    copy: es ? "Copiar link" : "Copy link",
    copied: es ? "¡Copiado!" : "Copied!",
    share: es ? "Compartilo" : "Share it",
    rewards: es ? "Recompensas" : "Rewards",
    earned: es ? "Conseguido" : "Unlocked",
    next: es ? "Siguiente" : "Next",
    toGo: es ? "te faltan" : "to go",
    referralSingular: es ? "referido" : "referral",
    referralPlural: es ? "referidos" : "referrals",
    rewardEarlyAccess: es ? "Acceso anticipado" : "Early access",
    rewardFreeMonth: es ? "Un mes gratis" : "A free month",
    rewardMerch: es ? "Merch" : "Merch",
  };
}
