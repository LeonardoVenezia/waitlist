import type { Plan } from "@/lib/plans";

export type TemplateId = "neon" | "carbon" | "pastel";

export interface NeonTemplateData {
  badge_text: string;
  title: string;
  subtitle: string;
  cta_label: string;
  social_count_override: string;
  milestone_3_label: string;
  milestone_5_label: string;
  milestone_10_label: string;
  show_social_proof: boolean;
}

export interface CarbonTemplateData {
  eyebrow: string;
  title: string;
  emphasis: string;
  subtitle: string;
  cta_label: string;
  mockup_image: string;
  social_count_override: string;
  show_social_proof: boolean;
}

export interface PastelTemplateData {
  badge_text: string;
  title: string;
  subtitle: string;
  cta_label: string;
  social_count_override: string;
  show_social_proof: boolean;
  floating_tags: string[];
}

export type TemplateData = NeonTemplateData | CarbonTemplateData | PastelTemplateData;

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  thumbnail: string;
  defaultData: TemplateData;
}

const neonDefaults: NeonTemplateData = {
  badge_text: "🔒 Early Access — Cohort 01",
  title: "Join the waitlist",
  subtitle: "Be first in line for early access and founder perks.",
  cta_label: "Claim my spot",
  social_count_override: "",
  milestone_3_label: "3 referrals — unlock a reward",
  milestone_5_label: "5 referrals — unlock a bigger reward",
  milestone_10_label: "10 referrals — unlock the top reward",
  show_social_proof: true,
};

const carbonDefaults: CarbonTemplateData = {
  eyebrow: "PRIVATE BETA",
  title: "The waitlist that builds hype",
  emphasis: "hype",
  subtitle: "Request access to see the product before anyone else.",
  cta_label: "Request Access",
  mockup_image: "",
  social_count_override: "",
  show_social_proof: true,
};

const pastelDefaults: PastelTemplateData = {
  badge_text: "Join 8,000+ people already in line",
  title: "Get early access",
  subtitle: "A warm welcome to what we're building. No spam, just the good stuff.",
  cta_label: "Join the waitlist",
  social_count_override: "",
  show_social_proof: true,
  floating_tags: ["Early access", "No spam", "Founder-only"],
};

export const TEMPLATE_DEFINITIONS: Record<TemplateId, TemplateDefinition> = {
  neon: {
    id: "neon",
    name: "Neon",
    description: "Dark focused hero with an embedded email bar and referral dashboard.",
    thumbnail: "⬛",
    defaultData: neonDefaults,
  },
  carbon: {
    id: "carbon",
    name: "Carbon",
    description: "Developer-style product teaser with a macOS mockup window.",
    thumbnail: "🖥️",
    defaultData: carbonDefaults,
  },
  pastel: {
    id: "pastel",
    name: "Pastel",
    description: "Soft animated gradient with a floating glass card.",
    thumbnail: "🌸",
    defaultData: pastelDefaults,
  },
};

export function hasTemplateAccess(plan: Plan): boolean {
  return plan !== "free";
}

export function getTemplateDefinition(id: unknown): TemplateDefinition | null {
  if (typeof id !== "string") return null;
  if (!(id in TEMPLATE_DEFINITIONS)) return null;
  return TEMPLATE_DEFINITIONS[id as TemplateId];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function normalizeTemplateData(id: TemplateId, value: unknown): TemplateData {
  const raw = (value ?? {}) as Record<string, unknown>;
  const def = TEMPLATE_DEFINITIONS[id];

  if (id === "neon") {
    const defaults = def.defaultData as NeonTemplateData;
    return {
      ...defaults,
      badge_text: asString(raw.badge_text) || defaults.badge_text,
      title: asString(raw.title) || defaults.title,
      subtitle: asString(raw.subtitle) || defaults.subtitle,
      cta_label: asString(raw.cta_label) || defaults.cta_label,
      social_count_override: asString(raw.social_count_override),
      milestone_3_label: asString(raw.milestone_3_label) || defaults.milestone_3_label,
      milestone_5_label: asString(raw.milestone_5_label) || defaults.milestone_5_label,
      milestone_10_label: asString(raw.milestone_10_label) || defaults.milestone_10_label,
      show_social_proof: asBool(raw.show_social_proof, defaults.show_social_proof),
    };
  }

  if (id === "carbon") {
    const defaults = def.defaultData as CarbonTemplateData;
    return {
      ...defaults,
      eyebrow: asString(raw.eyebrow) || defaults.eyebrow,
      title: asString(raw.title) || defaults.title,
      emphasis: asString(raw.emphasis) || defaults.emphasis,
      subtitle: asString(raw.subtitle) || defaults.subtitle,
      cta_label: asString(raw.cta_label) || defaults.cta_label,
      mockup_image: asString(raw.mockup_image),
      social_count_override: asString(raw.social_count_override),
      show_social_proof: asBool(raw.show_social_proof, defaults.show_social_proof),
    };
  }

  const defaults = def.defaultData as PastelTemplateData;
  return {
    ...defaults,
    badge_text: asString(raw.badge_text) || defaults.badge_text,
    title: asString(raw.title) || defaults.title,
    subtitle: asString(raw.subtitle) || defaults.subtitle,
    cta_label: asString(raw.cta_label) || defaults.cta_label,
    social_count_override: asString(raw.social_count_override),
    show_social_proof: asBool(raw.show_social_proof, defaults.show_social_proof),
    floating_tags: asStringArray(raw.floating_tags).length
      ? asStringArray(raw.floating_tags)
      : defaults.floating_tags,
  };
}
