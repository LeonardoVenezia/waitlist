// Admin gate via env var: ADMIN_EMAILS is a comma-separated list of allowed
// admin emails. Keep this in env (not in the database) so it lives with the
// other deploy-time config and can be rotated without a migration.

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
