import type { EmailBrand } from "@/lib/email-brand";
import {
  emailButton,
  emailFootnote,
  emailHeading,
  emailP,
  escapeHtml,
  renderEmailDocument,
} from "./layout";

export function renderShowcaseExpiryEmail({
  brand,
  daysLeft,
  productName,
  upgradeUrl,
}: {
  brand: EmailBrand;
  daysLeft: 30 | 7;
  productName: string;
  upgradeUrl: string;
}) {
  const headline =
    daysLeft === 30
      ? "Your listing expires in 30 days"
      : "Your listing expires in 7 days";

  const message =
    daysLeft === 30
      ? `<strong>${escapeHtml(productName)}</strong> has been listed in the directory for almost a year. In 30 days we will automatically remove it from the public listing.`
      : `There are 7 days left before we remove <strong>${escapeHtml(productName)}</strong> from the public listing. Your data stays saved, but the product stops being visible.`;

  const cta = daysLeft === 30 ? "Subscribe now" : "Reactivate my listing";

  return renderEmailDocument({
    brand,
    preheader: headline,
    content: [
      emailHeading(brand, headline),
      emailP(brand, message),
      emailP(
        brand,
        `With the <strong>Launch</strong> plan ($9/month) your product stays listed with no time limit, and you get 1,000 emails on the waitlist plus page builder templates.`,
      ),
      emailButton(brand, { label: cta, url: upgradeUrl }),
      emailFootnote(
        brand,
        `The backlink from the directory stays yours while the product is listed. When the listing expires, you lose that exposure.`,
      ),
    ].join("\n"),
  });
}
