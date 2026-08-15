const RESEND_API_URL = "https://api.resend.com/emails";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.EMAIL_FROM,
  replyTo,
}: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — email not sent");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  if (!from) {
    console.warn("EMAIL_FROM not set — email not sent");
    return { ok: false, error: "EMAIL_FROM not configured" };
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Failed to send email:", err);
    return { ok: false, error: err };
  }

  return { ok: true };
}
