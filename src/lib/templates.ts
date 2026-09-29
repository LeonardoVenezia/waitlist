import type { Plan } from "@/lib/plans";

export type TemplateId =
  | "neon"
  | "carbon"
  | "pastel"
  | "editorial"
  | "split"
  | "mono"
  | "aurora";

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

export interface MonoTemplateData {
  badge_text: string;
  title: string;
  subtitle: string;
  cta_label: string;
  social_count_override: string;
  show_social_proof: boolean;
}

export interface AuroraTemplateData {
  badge_text: string;
  /** Supports `*asterisks*` around a word to render it in serif italics. */
  title: string;
  subtitle: string;
  cta_label: string;
  social_count_override: string;
  show_social_proof: boolean;
  floating_tags: string[];
}

export type TemplateData =
  | NeonTemplateData
  | CarbonTemplateData
  | PastelTemplateData
  | EditorialTemplateData
  | SplitTemplateData
  | MonoTemplateData
  | AuroraTemplateData;

/**
 * Email-safe representation of a template. Emails are a surface where the
 * design cannot be derived: clients strip CSS variables, don't understand
 * oklch, ignore gradients, and can't load Geist or Italiana. So each template
 * declares a curated flat palette — the same idea as `thumbnail` (a
 * representation of the template for a surface that isn't the page), one
 * surface lower.
 *
 * Values are chosen so every text/background pair clears WCAG AA. They are
 * NOT a copy of the page classes: several of those fail (white on Neon's
 * #22c563 is 2.27:1).
 */
export type EmailPalette = {
  background: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  linkColor: string;
  /** Corner radius in px, as a string. Mono is 0 — sharp corners are its identity. */
  radius: string;
  headingFamily: string;
  labelFamily: string;
}

// System stacks: a webfont in email is unreliable (Gmail strips @font-face),
// so a template's type character is approximated, never reproduced exactly.
export const EMAIL_FONTS = {
  sans: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  mono: "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace",
  serif: "Georgia,'Times New Roman',Times,serif",
} as const;

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  /**
   * Thumbnail styling for the dashboard's template picker. `bg` and `text`
   * are hardcoded Tailwind classes that recreate the template's actual look
   * at a small size so users can recognize it at a glance.
   */
  thumbnail: { bg: string; text: string };
  emailPalette: EmailPalette;
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

const monoDefaults: MonoTemplateData = {
  badge_text: "v1.0 · opening soon",
  title: "Launch your waitlist in one afternoon",
  subtitle: "Waitlists, referrals and social proof in one place. No code required.",
  cta_label: "Request access",
  social_count_override: "",
  show_social_proof: true,
};

const auroraDefaults: AuroraTemplateData = {
  badge_text: "Now in private beta",
  title: "Launch something *worth* waiting for",
  subtitle: "A waitlist that looks as good as the thing you're building.",
  cta_label: "Get early access",
  social_count_override: "",
  show_social_proof: true,
  floating_tags: ["Launch updates", "Founder perks", "Zero noise"],
};

export const TEMPLATE_DEFINITIONS: Record<TemplateId, TemplateDefinition> = {
  neon: {
    id: "neon",
    name: "Neon",
    description: "Dark focused hero with an embedded email bar and referral dashboard.",
    thumbnail: {
      bg: "bg-zinc-950",
      text: "text-emerald-400",
    },
    // Neon is a dark page on the web. In email it is adapted to a light page:
    // dark transactional email renders badly in clients that force their own
    // dark mode. It keeps its emerald accent and its mono labels, and the
    // black-on-emerald button it already uses on the page (which is AA).
    emailPalette: {
      background: "#FFFFFF",
      surface: "#F4F4F5",
      border: "#E4E4E7",
      text: "#18181B",
      muted: "#52525B",
      accent: "#22C563",
      accentText: "#0A0A0A",
      linkColor: "#166534",
      radius: "10px",
      headingFamily: EMAIL_FONTS.sans,
      labelFamily: EMAIL_FONTS.mono,
    },
    defaultData: neonDefaults,
  },
  carbon: {
    id: "carbon",
    name: "Carbon",
    description: "Developer-style product teaser with a macOS mockup window.",
    thumbnail: {
      bg: "bg-zinc-900",
      text: "text-emerald-400/80",
    },
    // Adapted to a light page for the same reason as Neon. Its emerald is
    // darkened (emerald-500 with white text is ~2.5:1); the cyan second accent
    // stays out of email, where it would just be a stray hue.
    emailPalette: {
      background: "#FFFFFF",
      surface: "#F4F4F5",
      border: "#E4E4E7",
      text: "#18181B",
      muted: "#52525B",
      accent: "#047857",
      accentText: "#FFFFFF",
      linkColor: "#047857",
      radius: "10px",
      headingFamily: EMAIL_FONTS.sans,
      labelFamily: EMAIL_FONTS.mono,
    },
    defaultData: carbonDefaults,
  },
  pastel: {
    id: "pastel",
    name: "Pastel",
    description: "Soft animated gradient with a floating glass card.",
    thumbnail: {
      bg: "bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200",
      text: "text-zinc-800",
    },
    // Its gradient cannot be trusted in email (many clients drop it), so the
    // page becomes a flat tint derived from it. The violet is deepened: white
    // on its page accent #8b5cf6 is 4.23:1, just under AA.
    emailPalette: {
      background: "#F5EEFF",
      surface: "#FFFFFF",
      border: "#E9D5FF",
      text: "#27272A",
      muted: "#52525B",
      accent: "#7C3AED",
      accentText: "#FFFFFF",
      linkColor: "#6D28D9",
      radius: "20px",
      headingFamily: EMAIL_FONTS.sans,
      labelFamily: EMAIL_FONTS.sans,
    },
    defaultData: pastelDefaults,
  },
  editorial: {
    id: "editorial",
    name: "Editorial",
    description: "High-contrast asymmetric layout with a feature grid.",
    thumbnail: {
      bg: "bg-white border-b border-zinc-200",
      text: "text-zinc-900",
    },
    // The only template whose accent is per-project (template_data.accent_color,
    // applied by the email brand resolver). Keeps its serif identity, which in
    // email is approximated with a Georgia stack.
    emailPalette: {
      background: "#FFFFFF",
      surface: "#FFFFFF",
      border: "#E5E5E5",
      text: "#171717",
      muted: "#525252",
      accent: "#1A1A1A",
      accentText: "#FFFFFF",
      linkColor: "#1A1A1A",
      radius: "8px",
      headingFamily: EMAIL_FONTS.serif,
      labelFamily: EMAIL_FONTS.mono,
    },
    defaultData: editorialDefaults,
  },
  split: {
    id: "split",
    name: "Split",
    description: "Sticky benefits column with an interactive tabbed preview.",
    thumbnail: {
      bg: "bg-zinc-100",
      text: "text-zinc-900",
    },
    // Cream page, ink CTA, serif headline: the closest template to the app's
    // own email look, and the only one that needs no adaptation.
    emailPalette: {
      background: "#FAFAFA",
      surface: "#FFFFFF",
      border: "#E5E5E5",
      text: "#171717",
      muted: "#525252",
      accent: "#111111",
      accentText: "#FFFFFF",
      linkColor: "#111111",
      radius: "10px",
      headingFamily: EMAIL_FONTS.serif,
      labelFamily: EMAIL_FONTS.mono,
    },
    defaultData: splitDefaults,
  },
  mono: {
    id: "mono",
    name: "Mono",
    description: "Brutalist precision: terminal badge, oversized headline, one electric accent.",
    thumbnail: {
      bg: "bg-[#FAFAFA] border-b border-zinc-200",
      text: "text-zinc-900",
    },
    // The one template that transfers to email unchanged: #FAFAFA, one electric
    // accent, mono labels, hairline borders. Its muted value is the same one the
    // page was corrected to for AA (#646464 on #FAFAFA = 5.67:1).
    emailPalette: {
      background: "#FAFAFA",
      surface: "#FFFFFF",
      border: "#E5E5E5",
      text: "#0A0A0A",
      muted: "#646464",
      accent: "#2540FF",
      accentText: "#FFFFFF",
      linkColor: "#2540FF",
      radius: "0",
      headingFamily: EMAIL_FONTS.sans,
      labelFamily: EMAIL_FONTS.mono,
    },
    defaultData: monoDefaults,
  },
  aurora: {
    id: "aurora",
    name: "Aurora",
    description: "Full-viewport dawn gradient, glassmorphism, and an editorial serif headline.",
    thumbnail: {
      bg: "bg-gradient-to-br from-[#FFD9B7] via-[#FFB8C8] to-[#8E7BF0]",
      text: "text-white",
    },
    // Aurora is a saturated gradient with white text, which email cannot
    // reproduce (gradients get dropped, white on a tint would not read). So the
    // page becomes a warm flat tint with an ink CTA — the same editorial
    // character, legible everywhere.
    emailPalette: {
      background: "#FFF4EE",
      surface: "#FFFFFF",
      border: "#F2D9C9",
      text: "#1A1523",
      muted: "#5B5462",
      accent: "#141019",
      accentText: "#FFFFFF",
      linkColor: "#6D28D9",
      radius: "18px",
      headingFamily: EMAIL_FONTS.serif,
      labelFamily: EMAIL_FONTS.sans,
    },
    defaultData: auroraDefaults,
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

  if (id === "mono") {
    const defaults = def.defaultData as MonoTemplateData;
    return {
      ...defaults,
      badge_text: asString(raw.badge_text) || defaults.badge_text,
      title: asString(raw.title) || defaults.title,
      subtitle: asString(raw.subtitle) || defaults.subtitle,
      cta_label: asString(raw.cta_label) || defaults.cta_label,
      social_count_override: asString(raw.social_count_override),
      show_social_proof: asBool(raw.show_social_proof, defaults.show_social_proof),
    };
  }

  if (id === "aurora") {
    const defaults = def.defaultData as AuroraTemplateData;
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
