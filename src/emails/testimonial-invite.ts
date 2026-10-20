import type { EmailBrand } from "@/lib/email-brand";
import {
  emailButton,
  emailFootnote,
  emailHeading,
  emailLink,
  emailP,
  escapeHtml,
  renderEmailDocument,
} from "./layout";

export function renderTestimonialInviteEmail({
  brand,
  productName,
  formUrl,
  senderName,
}: {
  brand: EmailBrand;
  productName: string;
  formUrl: string;
  senderName?: string | null;
}) {
  const from = senderName ? `${escapeHtml(senderName)} from` : "the team at";

  return renderEmailDocument({
    brand,
    preheader: `Tell us about your experience with ${productName}`,
    content: [
      emailHeading(brand, "Would you share your experience?"),
      emailP(
        brand,
        `${from} <strong>${escapeHtml(productName)}</strong> we would love to hear what you thought.
    A short testimonial helps us keep improving and helps more people discover the product.`,
        { preLine: true },
      ),
      emailButton(brand, { label: "Leave my testimonial", url: formUrl }),
      emailFootnote(
        brand,
        `It only takes a minute. If the button does not work, copy and paste this link into your browser:<br>${emailLink(brand, formUrl, escapeHtml(formUrl))}`,
      ),
    ].join("\n"),
  });
}
