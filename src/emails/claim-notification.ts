export function renderClaimNotificationEmail({
  showcaseName,
  claimantEmail,
  message,
  claimUrl,
}: {
  showcaseName: string;
  claimantEmail: string;
  message: string | null;
  claimUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px;max-width:480px;margin:0 auto;color:#111;">
  <h1 style="font-size:20px;font-weight:600;margin:0 0 8px;">New project claim</h1>
  <p style="font-size:14px;color:#555;margin:0 0 16px;line-height:1.5;">
    <strong>${claimantEmail}</strong> wants to claim the product
    <strong>${showcaseName}</strong>.
  </p>
  ${
    message
      ? `<p style="font-size:14px;color:#333;margin:0 0 16px;line-height:1.5;background:#f4f4f4;padding:12px;border-radius:6px;white-space:pre-line;">${escapeHtml(message)}</p>`
      : ""
  }
  <a href="${claimUrl}" style="display:inline-block;background:#22c563;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:500;">Review claim</a>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
