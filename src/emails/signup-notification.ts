export function renderSignupNotificationEmail({
  waitlistName,
  subscriberEmail,
  referralCode,
  totalCount,
}: {
  waitlistName: string;
  subscriberEmail: string;
  referralCode: string;
  totalCount: number;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px;max-width:480px;margin:0 auto;">
  <h1 style="font-size:20px;font-weight:600;margin:0 0 8px;">New signup!</h1>
  <p style="font-size:14px;color:#555;margin:0 0 16px;">
    ${subscriberEmail} just joined <strong>${waitlistName}</strong>.
    Total signups: <strong>${totalCount}</strong>
  </p>
  <p style="font-size:14px;color:#555;margin:0 0 16px;">
    Referral code: <code style="background:#f5f5f5;padding:2px 6px;border-radius:4px;">${referralCode}</code>
  </p>
</body>
</html>`;
}
