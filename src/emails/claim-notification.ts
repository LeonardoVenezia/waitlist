import type { EmailBrand } from "@/lib/email-brand";
import {
  emailButton,
  emailHeading,
  emailP,
  emailPanel,
  escapeHtml,
  renderEmailDocument,
} from "./layout";

export function renderClaimNotificationEmail({
  brand,
  showcaseName,
  claimantEmail,
  message,
  claimUrl,
}: {
  brand: EmailBrand;
  showcaseName: string;
  claimantEmail: string;
  message: string | null;
  claimUrl: string;
}) {
  return renderEmailDocument({
    brand,
    preheader: `${claimantEmail} wants to claim ${showcaseName}`,
    content: [
      emailHeading(brand, "New project claim"),
      emailP(
        brand,
        `<strong>${escapeHtml(claimantEmail)}</strong> wants to claim the product <strong>${escapeHtml(showcaseName)}</strong>.`,
        { color: brand.text },
      ),
      message
        ? emailPanel(
            brand,
            `<span style="white-space:pre-line;">${escapeHtml(message)}</span>`,
          )
        : "",
      emailButton(brand, { label: "Review claim", url: claimUrl }),
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
