export function renderVerificationEmail({
  email,
  waitlistName,
  verificationLink,
}: {
  email: string;
  waitlistName: string;
  verificationLink: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px;max-width:480px;margin:0 auto;">
  <h1 style="font-size:20px;font-weight:600;margin:0 0 8px;">Verify your email</h1>
  <p style="font-size:14px;color:#555;margin:0 0 16px;">
    Thanks for joining <strong>${waitlistName}</strong>. Click the link below to verify your email address:
  </p>
  <a href="${verificationLink}" style="display:inline-block;padding:10px 20px;background:#22c563;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">Verify email</a>
  <p style="font-size:12px;color:#999;margin-top:24px;">Sent to ${email}</p>
</body>
</html>`;
}
