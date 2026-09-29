import type { EmailBrand } from "@/lib/email-brand";
import {
  emailButton,
  emailFootnote,
  emailHeading,
  emailP,
  escapeHtml,
  renderEmailDocument,
} from "./layout";

export function renderVerificationEmail({
  brand,
  email,
  waitlistName,
  verificationLink,
  message,
}: {
  brand: EmailBrand;
  email: string;
  waitlistName: string;
  verificationLink: string;
  message?: string;
}) {
  const body = message
    ? escapeHtml(message)
    : `Thanks for joining <strong>${escapeHtml(waitlistName)}</strong>. Click the link below to verify your email address:`;

  return renderEmailDocument({
    brand,
    preheader: `Verify your email to confirm your spot on ${waitlistName}`,
    content: [
      emailHeading(brand, "Verify your email"),
      emailP(brand, body, { preLine: true }),
      emailButton(brand, { label: "Verify email", url: verificationLink }),
      emailFootnote(brand, `Sent to ${escapeHtml(email)}`),
    ].join("\n"),
  });
}
