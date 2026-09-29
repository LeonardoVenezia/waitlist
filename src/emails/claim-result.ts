import type { EmailBrand } from "@/lib/email-brand";
import {
  emailButton,
  emailFootnote,
  emailHeading,
  emailP,
  emailPanel,
  escapeHtml,
  renderEmailDocument,
} from "./layout";

export function renderClaimResultEmail({
  brand,
  result,
  showcaseName,
  dashboardUrl,
  reason,
}: {
  brand: EmailBrand;
  result: "approved" | "rejected";
  showcaseName: string;
  dashboardUrl?: string;
  reason?: string | null;
}) {
  if (result === "approved") {
    return renderEmailDocument({
      brand,
      preheader: `You now own ${showcaseName}`,
      content: [
        emailHeading(brand, "Your claim was approved"),
        emailP(
          brand,
          `You now own <strong>${escapeHtml(showcaseName)}</strong> on [PACK]. The project is in your dashboard — you can manage the waitlist, customize the page builder, and publish your showcase.`,
        ),
        emailButton(brand, {
          label: "Open dashboard",
          url: dashboardUrl ?? "",
        }),
        emailFootnote(
          brand,
          "If you didn&apos;t request this, please reply to this email and we&apos;ll take a look.",
        ),
      ].join("\n"),
    });
  }

  return renderEmailDocument({
    brand,
    preheader: `Your claim for ${showcaseName} was not approved`,
    content: [
      emailHeading(brand, "Your claim was not approved"),
      emailP(
        brand,
        `We reviewed your claim for <strong>${escapeHtml(showcaseName)}</strong> and couldn&apos;t approve it at this time.`,
      ),
      reason ? emailPanel(brand, escapeHtml(reason)) : "",
      emailFootnote(
        brand,
        "If you think this was a mistake, reply to this email with more context.",
      ),
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
