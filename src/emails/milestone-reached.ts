import type { EmailBrand } from "@/lib/email-brand";
import {
  emailFootnote,
  emailHeading,
  emailP,
  emailPanel,
  escapeHtml,
  renderEmailDocument,
} from "./layout";

export function renderMilestoneReachedEmail({
  brand,
  email,
  waitlistName,
  count,
  reward,
}: {
  brand: EmailBrand;
  email: string;
  waitlistName: string;
  count: number;
  reward: string;
}) {
  return renderEmailDocument({
    brand,
    preheader: `You unlocked a reward on ${waitlistName}`,
    content: [
      emailHeading(brand, `🎉 You reached ${count} referrals!`),
      emailP(
        brand,
        `Congrats! You've unlocked a reward on <strong>${escapeHtml(waitlistName)}</strong>:`,
      ),
      emailPanel(
        brand,
        `<p style="margin:0;font-size:16px;font-weight:600;color:${brand.text};">🎁 ${escapeHtml(reward)}</p>`,
      ),
      emailP(brand, "Keep sharing your referral link to earn more rewards!"),
      emailFootnote(brand, `Sent to ${escapeHtml(email)}`),
    ].join("\n"),
  });
}
