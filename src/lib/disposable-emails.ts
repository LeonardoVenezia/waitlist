// Common disposable email domains — this list is intentionally small for MVP.
// In production, use an API like https://github.com/disposable/disposable-email-domains
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "throwaway.email",
  "yopmail.com",
  "sharklasers.com",
  "maildrop.cc",
  "mailnesia.com",
  "getairmail.com",
  "temp-mail.org",
  "fakeinbox.com",
  "trashmail.com",
  "mailcatch.com",
  "spamgourmet.com",
  "dispostable.com",
  "mailmetrash.com",
  "mailexpire.com",
  "mytemp.email",
  "mail.tm",
  "tempr.email",
  "emailondeck.com",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@").pop()?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}
