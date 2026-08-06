export function renderMilestoneReachedEmail({
  email,
  waitlistName,
  count,
  reward,
}: {
  email: string;
  waitlistName: string;
  count: number;
  reward: string;
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px;max-width:480px;margin:0 auto;">
  <h1 style="font-size:20px;font-weight:600;margin:0 0 8px;">🎉 You reached ${count} referrals!</h1>
  <p style="font-size:14px;color:#555;margin:0 0 16px;">
    Congrats! You've unlocked a reward on <strong>${waitlistName}</strong>:
  </p>
  <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin-bottom:16px;">
    <p style="font-size:16px;font-weight:500;margin:0;">🎁 ${reward}</p>
  </div>
  <p style="font-size:14px;color:#555;margin:0 0 16px;">
    Keep sharing your referral link to earn more rewards!
  </p>
  <p style="font-size:12px;color:#999;margin-top:24px;">Sent to ${email}</p>
</body>
</html>`;
}
