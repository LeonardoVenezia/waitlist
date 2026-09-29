import { EMAIL_FONTS } from "@/lib/templates";
import type { EmailBrand } from "@/lib/email-brand";
import {
  emailHeading,
  emailP,
  emailPanel,
  escapeHtml,
  renderEmailDocument,
} from "./layout";

export function renderSignupNotificationEmail({
  brand,
  waitlistName,
  subscriberEmail,
  referralCode,
  totalCount,
}: {
  brand: EmailBrand;
  waitlistName: string;
  subscriberEmail: string;
  referralCode: string;
  totalCount: number;
}) {
  return renderEmailDocument({
    brand,
    preheader: `${subscriberEmail} just joined ${waitlistName}`,
    content: [
      emailHeading(brand, "New signup!"),
      emailP(
        brand,
        `<strong>${escapeHtml(subscriberEmail)}</strong> just joined <strong>${escapeHtml(waitlistName)}</strong>. Total signups: <strong>${totalCount}</strong>`,
        { color: brand.text },
      ),
      emailPanel(
        brand,
        `Referral code: <span style="font-family:${EMAIL_FONTS.mono};font-size:13px;">${escapeHtml(referralCode)}</span>`,
      ),
    ].join("\n"),
  });
}
