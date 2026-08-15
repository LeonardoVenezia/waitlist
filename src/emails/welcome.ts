export function renderWelcomeEmail({
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
  const heading = `You're on the waitlist for ${waitlistName}!`;
  let body = message
    ? message
    : position
      ? `Your current position is #${position}. Share your referral link to climb higher!`
      : "Share your referral link to climb the leaderboard!";

  if (!message && rewardText) {
    body += ` ${rewardText}`;
  }

  let milestonesHtml = "";
  if (milestones && milestones.length > 0) {
    milestonesHtml = `
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin-top:16px;">
        <p style="font-size:14px;font-weight:500;margin:0 0 8px;">Rewards you can earn:</p>
        <ul style="margin:0;padding:0 0 0 18px;font-size:13px;color:#555;">
          ${milestones.map((m) => `<li style="margin-bottom:4px;">🎁 <strong>${m.reward}</strong> at ${m.count} referrals</li>`).join("")}
        </ul>
      </div>`;
  }

  const ctaUrlFinal = customizeCta && ctaUrl ? ctaUrl : referralLink;
  const ctaHtml = hideCta
    ? ""
    : `<a href="${ctaUrlFinal}" style="display:inline-block;padding:10px 20px;background:#22c563;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;margin-top:16px;">Share your referral link</a>`;

  const signatureHtml = signature
    ? `<p style="font-size:14px;color:#555;margin:16px 0 0;white-space:pre-line;">${signature}</p>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px;max-width:480px;margin:0 auto;">
  <h1 style="font-size:20px;font-weight:600;margin:0 0 8px;">${heading}</h1>
  <p style="font-size:14px;color:#555;margin:0 0 16px;white-space:pre-line;">${body}</p>
  ${milestonesHtml}
  ${ctaHtml}
  ${signatureHtml}
  <p style="font-size:12px;color:#999;margin-top:24px;">Sent to ${email}</p>
</body>
</html>`;
}