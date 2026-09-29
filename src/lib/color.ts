/**
 * Color utilities shared by the surfaces that cannot use CSS variables or
 * oklch: email clients and computed accent text.
 *
 * Everything here is pure and dependency-free, because a wrong value in these
 * paths ships an unreadable surface rather than throwing.
 */

export type Rgb = [number, number, number];

function parseHex(value: string): Rgb | null {
  const hex = value.trim();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
  if (short) {
    return [1, 2, 3].map((i) => parseInt(short[i] + short[i], 16)) as Rgb;
  }
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (long) {
    return [1, 2, 3].map((i) => parseInt(long[i], 16)) as Rgb;
  }
  return null;
}

// oklch → sRGB (Björn Ottosson).
function oklchToRgb(L: number, C: number, H: number): Rgb {
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
  }) as Rgb;
}

export function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/**
 * Normalizes any color a project may have stored (hex, oklch, rgb) into plain
 * hex. Returns null when the value is unusable, so callers fall back instead of
 * shipping a broken color.
 */
export function toHexColor(value: unknown): string | null {
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

/** The color as RGB, or null when it cannot be parsed. */
export function toRgb(value: unknown): Rgb | null {
  const hex = toHexColor(value);
  return hex ? parseHex(hex) : null;
}

function luminance([r, g, b]: Rgb): number {
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
export function mutedTextOn(background: string): string {
  const text = contrastTextOn(background);
  const rgb = parseHex(background);
  const [tr, tg, tb] = parseHex(text) ?? [0, 0, 0];
  if (!rgb) return text;
  for (const mix of [0.3, 0.2, 0.1]) {
    const candidate = rgbToHex(
      [0, 1, 2].map((i) => Math.round(rgb[i] + ([tr, tg, tb][i] - rgb[i]) * (1 - mix))) as Rgb,
    );
    if (contrastRatio(candidate, background) >= 4.5) return candidate;
  }
  return text;
}
