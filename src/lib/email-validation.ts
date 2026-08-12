import { promises as dns } from "node:dns";
import { isDisposableEmail } from "@/lib/disposable-emails";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailQuality = "deliverable" | "risky" | "undeliverable";

// ponytail: naive heuristic, no real MX timeout tuning; upgrade to a paid
// verifier (ZeroBounce/Abstract) if accuracy matters at scale.
export async function getEmailQuality(email: string): Promise<EmailQuality> {
  const normalized = email.toLowerCase().trim();

  if (!EMAIL_REGEX.test(normalized)) return "undeliverable";

  const domain = normalized.split("@").pop()!;
  if (isDisposableEmail(normalized)) return "undeliverable";
  if (domain.endsWith(".xyz") || domain.endsWith(".tk") || domain.endsWith(".ml")) return "risky";

  try {
    const records = await dns.resolveMx(domain);
    if (records.length === 0) return "undeliverable";
    return "deliverable";
  } catch {
    return "risky";
  }
}
