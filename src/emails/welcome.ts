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

export function renderWelcomeEmail({
  brand,
  email,
  waitlistName,
  referralLink,
  position,
  milestones,
  rewardText,
  message,
  signature,
  hideCta,
  customizeCta,
  ctaUrl,
}: {
  brand: EmailBrand;
  email: string;
  waitlistName: string;
  referralLink: string;
  position: number | null;
  milestones?: Array<{ count: number; reward: string }>;
  rewardText?: string | null;
  message?: string;
  signature?: string;
  hideCta?: boolean;
  customizeCta?: boolean;
  ctaUrl?: string;
}) {
  const heading = `You're on the waitlist for ${escapeHtml(waitlistName)}!`;

  let body = message
    ? escapeHtml(message)
    : position
      ? `Your current position is #${position}. Share your referral link to climb higher!`
      : "Share your referral link to climb the leaderboard!";

  if (!message && rewardText) {
    body += ` ${escapeHtml(rewardText)}`;
  }

  const milestonesHtml =
    milestones && milestones.length > 0
      ? emailPanel(
          brand,
          `<ul style="margin:0;padding:0 0 0 18px;font-size:14px;color:${brand.text};">
          ${milestones
            .map(
              (m) =>
                `<li style="margin-bottom:4px;">🎁 <strong>${escapeHtml(m.reward)}</strong> at ${m.count} referrals</li>`,
            )
            .join("")}
        </ul>`,
        )
      : "";

  const ctaUrlFinal = customizeCta && ctaUrl ? ctaUrl : referralLink;

  return renderEmailDocument({
    brand,
    preheader: position
      ? `You're #${position} in line for ${waitlistName}`
      : `You're on the waitlist for ${waitlistName}`,
    content: [
      emailHeading(brand, heading),
      emailP(brand, body, { preLine: true }),
      milestonesHtml,
      hideCta
        ? ""
        : emailButton(brand, { label: "Share your referral link", url: ctaUrlFinal }),
      signature ? emailP(brand, escapeHtml(signature), { preLine: true }) : "",
      emailFootnote(brand, `Sent to ${escapeHtml(email)}`),
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
