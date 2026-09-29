import {
  EMAIL_FONTS,
  getTemplateDefinition,
  type EmailPalette,
} from "@/lib/templates";
import {
  contrastRatio,
  contrastTextOn,
  mutedTextOn,
  toHexColor,
} from "@/lib/color";

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
      toHexColor(rawAccent && rawAccent !== "#2563eb" ? rawAccent : palette.accent) ??
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
    const background = toHexColor(global.bg_color) ?? APP_EMAIL_BRAND.background;
    const accent = toHexColor(global.button_color) ?? APP_EMAIL_BRAND.accent;
    return {
      background,
      surface: APP_EMAIL_BRAND.surface,
      border: APP_EMAIL_BRAND.border,
      text: contrastTextOn(background),
      muted: mutedTextOn(background),
      accent,
      accentText: toHexColor(global.button_text_color) ?? contrastTextOn(accent),
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
  const accent = toHexColor(branding.primary_color) ?? APP_EMAIL_BRAND.accent;
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
    accent: toHexColor(raw.accent) ?? APP_EMAIL_BRAND.accent,
    accentText: text("accentText", APP_EMAIL_BRAND.accentText),
    linkColor: text("linkColor", APP_EMAIL_BRAND.linkColor),
    radius: text("radius", APP_EMAIL_BRAND.radius),
    headingFamily: text("headingFamily", APP_EMAIL_BRAND.headingFamily),
    labelFamily: text("labelFamily", APP_EMAIL_BRAND.labelFamily),
    logoUrl: asText(raw.logoUrl) || null,
  };
}
