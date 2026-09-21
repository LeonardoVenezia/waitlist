import { TURNSTILE_ENABLED } from "@/lib/turnstile";

export async function validateTurnstileToken(
  token: string,
): Promise<boolean> {
  // Kill switch — see src/lib/turnstile.ts for how to re-enable.
  if (!TURNSTILE_ENABLED) return true;

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return true; // Allow if not configured (dev mode)

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      },
    );

    const data = (await res.json()) as { success: boolean };
    return data.success;
  } catch {
    return false;
  }
}
