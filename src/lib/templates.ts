import type { Plan } from "@/lib/plans";

export type TemplateId = "neon" | "carbon" | "pastel" | "editorial" | "split";

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

export interface EditorialTemplateData {
  accent_color: string;
  title: string;
  title_italic: string;
  subtitle: string;
  cta_label: string;
  features: Array<{ icon: string; title: string; description: string }>;
  launch_timeline: string;
  version_status: string;
  social_x: string;
  social_linkedin: string;
  show_social_proof: boolean;
}

export interface SplitTemplateData {
  title: string;
  subtitle: string;
  benefits: string[];
  cta_label: string;
  social_count_override: string;
  tabs: Array<{ label: string; title: string; description: string }>;
  testimonials: Array<{ quote: string; author: string }>;
  show_social_proof: boolean;
}

export type TemplateData =
  | NeonTemplateData
  | CarbonTemplateData
  | PastelTemplateData
  | EditorialTemplateData
  | SplitTemplateData;

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  /** 1-2 letter monogram rendered as the template thumbnail. */
  thumbnailInitials: string;
  /** Hint of the thumbnail's background tone: "dark" for neon/carbon, "light" for the rest. */
  thumbnailTone: "dark" | "light";
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

const editorialDefaults: EditorialTemplateData = {
  accent_color: "#2563eb",
  title: "Built for people who build",
  title_italic: "what's next",
  subtitle: "Join the waitlist and get early access to the tools behind the next wave of products.",
  cta_label: "Join the list →",
  features: [
    { icon: "◆", title: "Launch faster", description: "Everything you need to go from idea to public." },
    { icon: "◇", title: "Get discovered", description: "Reach founders and early adopters looking for what's new." },
    { icon: "○", title: "Collect proof", description: "Testimonials that compound your product's credibility." },
    { icon: "□", title: "Stay in control", description: "Clean tools, no lock-in, no unnecessary complexity." },
  ],
  launch_timeline: "Launching Q4 2026",
  version_status: "Private beta",
  social_x: "https://x.com",
  social_linkedin: "https://linkedin.com",
  show_social_proof: true,
};

const splitDefaults: SplitTemplateData = {
  title: "Everything you need to launch with confidence",
  subtitle: "One toolkit for waitlists, discovery, and social proof. Join early and shape what comes next.",
  benefits: [
    "Early access to new features",
    "Founder-first directory listing",
    "Waitlist with viral referrals",
    "Testimonials built in",
  ],
  cta_label: "Request access",
  social_count_override: "",
  tabs: [
    { label: "Waitlist", title: "Waitlist that grows itself", description: "Referral links, leaderboard, and smart positions built in." },
    { label: "Showcase", title: "Your product, discovered", description: "A curated directory that puts you in front of early adopters." },
    { label: "Proof", title: "Social proof on autopilot", description: "Collect and publish testimonials without extra tools." },
  ],
  testimonials: [
    { quote: "The fastest way to validate demand before we launched.", author: "Founder, early-stage SaaS" },
    { quote: "Our waitlist turned into our first community.", author: "Indie hacker" },
    { quote: "Simple to set up, and the referrals actually work.", author: "Product builder" },
  ],
  show_social_proof: true,
};

export const TEMPLATE_DEFINITIONS: Record<TemplateId, TemplateDefinition> = {
  neon: {
    id: "neon",
    name: "Neon",
    description: "Dark focused hero with an embedded email bar and referral dashboard.",
    thumbnailInitials: "Ne",
    thumbnailTone: "dark",
    defaultData: neonDefaults,
  },
  carbon: {
    id: "carbon",
    name: "Carbon",
    description: "Developer-style product teaser with a macOS mockup window.",
    thumbnailInitials: "Ca",
    thumbnailTone: "dark",
    defaultData: carbonDefaults,
  },
  pastel: {
    id: "pastel",
    name: "Pastel",
    description: "Soft animated gradient with a floating glass card.",
    thumbnailInitials: "Pa",
    thumbnailTone: "light",
    defaultData: pastelDefaults,
  },
  editorial: {
    id: "editorial",
    name: "Editorial",
    description: "High-contrast asymmetric layout with a feature grid.",
    thumbnailInitials: "Ed",
    thumbnailTone: "light",
    defaultData: editorialDefaults,
  },
  split: {
    id: "split",
    name: "Split",
    description: "Sticky benefits column with an interactive tabbed preview.",
    thumbnailInitials: "Sp",
    thumbnailTone: "light",
    defaultData: splitDefaults,
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

function asObjectArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
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

  if (id === "pastel") {
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

  if (id === "editorial") {
    const defaults = def.defaultData as EditorialTemplateData;
    return {
      ...defaults,
      accent_color: asString(raw.accent_color) || defaults.accent_color,
      title: asString(raw.title) || defaults.title,
      title_italic: asString(raw.title_italic) || defaults.title_italic,
      subtitle: asString(raw.subtitle) || defaults.subtitle,
      cta_label: asString(raw.cta_label) || defaults.cta_label,
      features: asObjectArray<EditorialTemplateData["features"][number]>(raw.features).length
        ? asObjectArray<EditorialTemplateData["features"][number]>(raw.features)
        : defaults.features,
      launch_timeline: asString(raw.launch_timeline) || defaults.launch_timeline,
      version_status: asString(raw.version_status) || defaults.version_status,
      social_x: asString(raw.social_x) || defaults.social_x,
      social_linkedin: asString(raw.social_linkedin) || defaults.social_linkedin,
      show_social_proof: asBool(raw.show_social_proof, defaults.show_social_proof),
    };
  }

  const defaults = def.defaultData as SplitTemplateData;
  return {
    ...defaults,
    title: asString(raw.title) || defaults.title,
    subtitle: asString(raw.subtitle) || defaults.subtitle,
    benefits: asStringArray(raw.benefits).length
      ? asStringArray(raw.benefits)
      : defaults.benefits,
    cta_label: asString(raw.cta_label) || defaults.cta_label,
    social_count_override: asString(raw.social_count_override),
    tabs: asObjectArray<SplitTemplateData["tabs"][number]>(raw.tabs).length
      ? asObjectArray<SplitTemplateData["tabs"][number]>(raw.tabs)
      : defaults.tabs,
    testimonials: asObjectArray<SplitTemplateData["testimonials"][number]>(raw.testimonials).length
      ? asObjectArray<SplitTemplateData["testimonials"][number]>(raw.testimonials)
      : defaults.testimonials,
    show_social_proof: asBool(raw.show_social_proof, defaults.show_social_proof),
  };
}
