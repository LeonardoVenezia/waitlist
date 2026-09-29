import {
  EMAIL_FONTS,
  getTemplateDefinition,
  type EmailPalette,
} from "@/lib/templates";

/**
 * The visual identity an email is rendered with. Built on EmailPalette (which
 * every template declares) plus the project's logo.
 */
export type EmailBrand = EmailPalette & {
  logoUrl: string | null;
};

/**
 * The app's own identity for emails that belong to the platform rather than to
 * a project (account verification, admin alerts, lifecycle notices).
 *
 * Emails cannot read `var(--token)` or oklch, so the brand accent is a literal.
 * Rust = --primary, i.e. oklch(0.48 0.19 70).
 */
export const APP_EMAIL_BRAND: EmailBrand = {
  background: "#FBFAF7", // --background, oklch(0.985 0.004 85)
  surface: "#FCFCFA", //    --card
  border: "#D8D3CC", //     --border
  text: "#14110D", //       --foreground
  muted: "#5A554C", //      --muted-foreground
  accent: "#9D3E00", //     keep in sync with --primary in globals.css
  accentText: "#FFFFFF",
  linkColor: "#9D3E00", //  keep in sync with --primary in globals.css
  radius: "8px", //         --radius
  headingFamily: EMAIL_FONTS.serif,
  labelFamily: EMAIL_FONTS.sans,
  logoUrl: null,
};

// ── Color helpers ──────────────────────────────────────
// Kept local and dependency-free: these run inside email rendering, where a
// wrong value silently ships an unreadable email.

function parseHex(value: string): [number, number, number] | null {
  const hex = value.trim();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
  if (short) {
    return [1, 2, 3].map((i) => parseInt(short[i] + short[i], 16)) as [number, number, number];
  }
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (long) {
    return [1, 2, 3].map((i) => parseInt(long[i], 16)) as [number, number, number];
  }
  return null;
}

// oklch → sRGB (Björn Ottosson). The page builder stores oklch(), which email
// clients do not understand.
function oklchToRgb(L: number, C: number, H: number): [number, number, number] {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const [l, m, s] = [l_ ** 3, m_ ** 3, s_ ** 3];
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return rgb.map((c) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(c, 0) ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255);
  }) as [number, number, number];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/**
 * Normalizes any color a project may have stored into something an email
 * client can render. Returns null when the value is unusable, so callers fall
 * back instead of shipping a broken color.
 */
export function toEmailColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const input = value.trim();
  if (!input) return null;

  const hex = parseHex(input);
  if (hex) return rgbToHex(hex);

  const oklch = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/i.exec(input);
  if (oklch) {
    return rgbToHex(oklchToRgb(Number(oklch[1]), Number(oklch[2]), Number(oklch[3])));
  }

  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(input);
  if (rgb) {
    return rgbToHex([Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]);
  }

  return null;
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: string, b: string): number {
  const [ra, rb] = [parseHex(a), parseHex(b)];
  if (!ra || !rb) return 0;
  const [hi, lo] = [luminance(ra), luminance(rb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Black or near-white — whichever actually reads on the given background. */
export function contrastTextOn(background: string): string {
  const rgb = parseHex(background);
  if (!rgb) return "#14110D";
  return luminance(rgb) > 0.18 ? "#14110D" : "#FFFFFF";
}

/**
 * The softest secondary tone that still clears AA on this background. Used
 * where the project picks its own colors, since those can be anything.
 */
function mutedTextOn(background: string): string {
  const text = contrastTextOn(background);
  const rgb = parseHex(background);
  const [tr, tg, tb] = parseHex(text) ?? [0, 0, 0];
  if (!rgb) return text;
  for (const mix of [0.3, 0.2, 0.1]) {
    const candidate = rgbToHex(
      [0, 1, 2].map((i) => Math.round(rgb[i] + ([tr, tg, tb][i] - rgb[i]) * (1 - mix))) as [
        number,
        number,
        number,
      ],
    );
    if (contrastRatio(candidate, background) >= 4.5) return candidate;
  }
  return text;
}

// ── Resolvers ──────────────────────────────────────────

function asRecord(value: unknown): Record<string, unknown> {
  return (value ?? {}) as Record<string, unknown>;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Mirror of the public page's own resolution order (template → custom sections
 * → classic), so the email looks like the page the subscriber just signed up
 * from.
 */
export function resolveWaitlistEmailBrand(
  settings: Record<string, unknown>,
): EmailBrand {
  const branding = asRecord(settings.branding);
  const logoUrl = asText(branding.logo_url) || null;
  const pageSections = asRecord(settings.page_sections);

  // 1. A template wins over the sections, exactly like p/[slug] does.
  const definition = getTemplateDefinition(pageSections.template_id);
  if (definition) {
    const palette = definition.emailPalette;
    if (definition.id !== "editorial") {
      return { ...palette, logoUrl };
    }
    // Editorial is the only template whose accent is per-project, so its
    // derived colors are computed rather than curated: any accent can be set.
    const rawAccent = asText(asRecord(pageSections.template_data).accent_color);
    // Same legacy guard as editorial-template.tsx: the old default is "unset".
    const accent =
      toEmailColor(rawAccent && rawAccent !== "#2563eb" ? rawAccent : palette.accent) ??
      palette.accent;
    return {
      ...palette,
      accent,
      accentText: contrastTextOn(accent),
      linkColor:
        contrastRatio(accent, palette.background) >= 4.5 ? accent : palette.text,
      logoUrl,
    };
  }

  // 2. Custom page-builder sections: the project's own colors drive the page.
  const sections = pageSections.sections;
  if (Array.isArray(sections) && sections.length > 0) {
    const global = asRecord(pageSections.global);
    const background =
      toEmailColor(global.bg_color) ?? APP_EMAIL_BRAND.background;
    const accent = toEmailColor(global.button_color) ?? APP_EMAIL_BRAND.accent;
    return {
      background,
      surface: APP_EMAIL_BRAND.surface,
      border: APP_EMAIL_BRAND.border,
      text: contrastTextOn(background),
      muted: mutedTextOn(background),
      accent,
      accentText:
        toEmailColor(global.button_text_color) ??
        contrastTextOn(accent),
      linkColor:
        contrastRatio(accent, background) >= 4.5
          ? accent
          : contrastTextOn(background),
      radius: "8px",
      headingFamily: EMAIL_FONTS.sans,
      labelFamily: EMAIL_FONTS.sans,
      logoUrl,
    };
  }

  // 3. Classic hosted page: just the project's primary color.
  return brandFromBranding(branding);
}

/**
 * The project's general identity, for emails about the project that are not
 * about the waitlist page (claim results, showcase lifecycle).
 */
export function resolveProjectEmailBrand(
  settings: Record<string, unknown>,
): EmailBrand {
  return brandFromBranding(asRecord(settings.branding));
}

function brandFromBranding(branding: Record<string, unknown>): EmailBrand {
  const accent = toEmailColor(branding.primary_color) ?? APP_EMAIL_BRAND.accent;
  return {
    ...APP_EMAIL_BRAND,
    accent,
    accentText: contrastTextOn(accent),
    linkColor:
      contrastRatio(accent, APP_EMAIL_BRAND.background) >= 4.5
        ? accent
        : APP_EMAIL_BRAND.text,
    logoUrl: asText(branding.logo_url) || null,
  };
}

/**
 * Rebuilds a brand that travelled through `email_queue` as JSON.
 *
 * Rows enqueued before a brand existed — or with a partial object — must not
 * break dispatch, so every field falls back to the app default. The cron has no
 * per-row try/catch around rendering, so a missing value here would otherwise
 * abort the whole batch.
 */
export function parseEmailBrand(value: unknown): EmailBrand {
  const raw = asRecord(value);
  const text = (key: keyof EmailBrand, fallback: string) =>
    asText(raw[key]) || fallback;
  return {
    background: text("background", APP_EMAIL_BRAND.background),
    surface: text("surface", APP_EMAIL_BRAND.surface),
    border: text("border", APP_EMAIL_BRAND.border),
    text: text("text", APP_EMAIL_BRAND.text),
    muted: text("muted", APP_EMAIL_BRAND.muted),
    accent: toEmailColor(raw.accent) ?? APP_EMAIL_BRAND.accent,
    accentText: text("accentText", APP_EMAIL_BRAND.accentText),
    linkColor: text("linkColor", APP_EMAIL_BRAND.linkColor),
    radius: text("radius", APP_EMAIL_BRAND.radius),
    headingFamily: text("headingFamily", APP_EMAIL_BRAND.headingFamily),
    labelFamily: text("labelFamily", APP_EMAIL_BRAND.labelFamily),
    logoUrl: asText(raw.logoUrl) || null,
  };
}
