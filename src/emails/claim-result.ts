export function renderClaimResultEmail({
  result,
  showcaseName,
  dashboardUrl,
  reason,
}: {
  result: "approved" | "rejected";
  showcaseName: string;
  dashboardUrl?: string;
  reason?: string | null;
}) {
  if (result === "approved") {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px;max-width:480px;margin:0 auto;color:#111;">
  <h1 style="font-size:20px;font-weight:600;margin:0 0 8px;">Your claim was approved</h1>
  <p style="font-size:14px;color:#555;margin:0 0 16px;line-height:1.5;">
    You now own <strong>${showcaseName}</strong> on [PACK]. The project is in your
    dashboard — you can manage the waitlist, customize the page builder, and
    publish your showcase.
  </p>
  <a href="${dashboardUrl ?? ""}" style="display:inline-block;background:#22c563;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:500;">Open dashboard</a>
  <p style="font-size:12px;color:#888;margin:24px 0 0;line-height:1.5;">
    If you didn&apos;t request this, please reply to this email and we&apos;ll take a look.
  </p>
</body>
</html>`;
  }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px;max-width:480px;margin:0 auto;color:#111;">
  <h1 style="font-size:20px;font-weight:600;margin:0 0 8px;">Your claim was not approved</h1>
  <p style="font-size:14px;color:#555;margin:0 0 16px;line-height:1.5;">
    We reviewed your claim for <strong>${showcaseName}</strong> and couldn&apos;t
    approve it at this time.
  </p>
  ${
    reason
      ? `<p style="font-size:14px;color:#333;margin:0 0 16px;line-height:1.5;background:#f4f4f4;padding:12px;border-radius:6px;">${escapeHtml(reason)}</p>`
      : ""
  }
  <p style="font-size:12px;color:#888;margin:24px 0 0;line-height:1.5;">
    If you think this was a mistake, reply to this email with more context.
  </p>
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
