import type { EmailBrand } from "@/lib/email-brand";

/**
 * Shared shell for every transactional email.
 *
 * Emails are not the web: no CSS variables, no external stylesheets, no
 * reliable `@font-face`, and inconsistent CSS support. So this is deliberately
 * primitive — tables for layout, every color and font inline, and an explicit
 * background on a wrapper table instead of relying on `<body>`, which several
 * clients (Outlook desktop) ignore.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderEmailDocument({
  brand,
  preheader,
  content,
}: {
  brand: EmailBrand;
  /** Shown in the inbox preview line, hidden in the body. */
  preheader?: string;
  content: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
</head>
<body style="margin:0;padding:0;background-color:${brand.background};">
${
  preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>`
    : ""
}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${brand.background};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="width:480px;max-width:100%;background-color:${brand.surface};border:1px solid ${brand.border};border-radius:${brand.radius};">
        <tr>
          <td style="padding:32px;font-family:${brand.labelFamily};font-size:15px;line-height:1.6;color:${brand.muted};">
${brand.logoUrl ? `<img src="${brand.logoUrl}" alt="" width="120" style="display:block;max-width:120px;height:auto;margin:0 0 24px;border:0;">` : ""}
${content}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function emailHeading(brand: EmailBrand, text: string): string {
  return `<h1 style="margin:0 0 12px;font-family:${brand.headingFamily};font-size:21px;font-weight:600;line-height:1.3;color:${brand.text};">${text}</h1>`;
}

export function emailP(
  brand: EmailBrand,
  html: string,
  { color, preLine }: { color?: string; preLine?: boolean } = {},
): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${color ?? brand.muted};${preLine ? "white-space:pre-line;" : ""}">${html}</p>`;
}

/** Small print: "sent to you@example.com", legal notes, fallback links. */
export function emailFootnote(brand: EmailBrand, html: string): string {
  return `<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:${brand.muted};">${html}</p>`;
}

export function emailLink(brand: EmailBrand, href: string, label: string): string {
  return `<a href="${href}" style="color:${brand.linkColor};text-decoration:underline;">${label}</a>`;
}

/** Bordered box for a referral link, a code, or a quoted reason. */
export function emailPanel(brand: EmailBrand, inner: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;background-color:${brand.background};border:1px solid ${brand.border};border-radius:${brand.radius};">
  <tr><td style="padding:14px 16px;font-size:14px;line-height:1.6;color:${brand.text};">${inner}</td></tr>
</table>`;
}

/**
 * Table-based button: Outlook desktop drops padding on `<a>`, so the padding
 * lives on the cell. `bgcolor` is kept alongside the inline style for the same
 * reason.
 */
export function emailButton(
  brand: EmailBrand,
  { label, url }: { label: string; url: string },
): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
  <tr>
    <td align="center" bgcolor="${brand.accent}" style="background-color:${brand.accent};border-radius:${brand.radius};">
      <a href="${url}" style="display:inline-block;padding:13px 24px;font-family:${brand.labelFamily};font-size:14px;font-weight:600;line-height:1;color:${brand.accentText};text-decoration:none;border-radius:${brand.radius};">${label}</a>
    </td>
  </tr>
</table>`;
}
