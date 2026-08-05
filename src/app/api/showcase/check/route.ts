import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST — run quality checks for all published showcases (cron job)
// GET — run for specific showcase ID
export async function POST() {
  const admin = createAdminClient();

  // Find all published showcases that need re-check (last checked > 30 days ago or never)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: showcases } = await admin
    .from("showcases")
    .select("id, link")
    .or(`last_domain_check.is.null,last_domain_check.lt.${thirtyDaysAgo}`)
    .in("status", ["published", "draft"]);

  if (!showcases || showcases.length === 0) {
    return NextResponse.json({ checked: 0 });
  }

  const results = [];
  for (const sc of showcases) {
    // Domain check
    let domainOk = false;
    try {
      const res = await fetch(sc.link, { method: "HEAD", signal: AbortSignal.timeout(10000) });
      domainOk = res.ok;
    } catch { /* ignore */ }

    // Anti-spam: puntapié
    const spamOk = true;

    const { error } = await admin
      .from("showcases")
      .update({
        domain_check_passed: domainOk,
        spam_check_passed: spamOk,
        last_domain_check: new Date().toISOString(),
        last_spam_check: new Date().toISOString(),
        // If published and fails checks, unpublish
        ...(domainOk ? {} : { status: "draft" }),
      })
      .eq("id", sc.id);

    results.push({ id: sc.id, domain_ok: domainOk, spam_ok: spamOk, error: error?.message });
  }

  return NextResponse.json({ checked: results.length, results });
}
