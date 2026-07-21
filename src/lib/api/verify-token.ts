import { createHash } from "node:crypto";

function getSecret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-secret-do-not-use-in-prod";
}

export function createVerificationToken(subscriberId: string, email: string): string {
  const secret = getSecret();
  const payload = `${subscriberId}:${email}`;
  const hash = createHash("sha256")
    .update(`${payload}:${secret}`)
    .digest("hex")
    .slice(0, 32);
  return Buffer.from(`${payload}:${hash}`).toString("base64url");
}

export function verifyToken(token: string): { subscriberId: string; email: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const colonIdx = decoded.lastIndexOf(":");
    if (colonIdx === -1) return null;

    const payload = decoded.slice(0, colonIdx);
    const hash = decoded.slice(colonIdx + 1);
    const parts = payload.split(":");
    const subscriberId = parts[0];
    const email = parts.slice(1).join(":");

    if (!subscriberId || !email || !hash) return null;

    const secret = getSecret();
    const expectedHash = createHash("sha256")
      .update(`${payload}:${secret}`)
      .digest("hex")
      .slice(0, 32);

    if (hash !== expectedHash) return null;
    return { subscriberId, email };
  } catch {
    return null;
  }
}
