/**
 * The brand accent, in the two forms different surfaces need. `--primary` in
 * globals.css is the source of truth; these are the literals for the places
 * that cannot read a CSS variable (a color input's value, a stored default, a
 * JSONB field, an email). Keep both in sync with it.
 */
export const BRAND_ACCENT_OKLCH = "oklch(0.48 0.19 70)"; // keep in sync with --primary in globals.css
export const BRAND_ACCENT_HEX = "#9D3E00"; // keep in sync with --primary in globals.css
