import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ publicKey: string }> },
) {
  const { publicKey } = await params;
  const supabase = createAdminClient();

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, name, public_key, settings")
    .eq("public_key", publicKey)
    .eq("status", "active")
    .maybeSingle();

  if (!waitlist) {
    return new NextResponse("Not found", { status: 404 });
  }

  const settings = (waitlist.settings as Record<string, unknown>) ?? {};
  const lb = (settings.leaderboard ?? {}) as Record<string, unknown>;

  const showTitle = (lb.show_title as boolean) ?? false;
  const title = (lb.title as string) || "Leaderboard";
  const subtitle = (lb.subtitle as string) || "";
  const usersLimit = (lb.users_limit as number) ?? 50;
  const showReferralCount = (lb.show_referral_count as boolean) ?? true;
  const showPosition = (lb.show_position as boolean) ?? true;
  const showName = (lb.show_name as boolean) ?? false;
  const headerBg = (lb.header_bg as string) ?? "#000000";
  const headerText = (lb.header_text as string) ?? "#ffffff";
  const oddBg = (lb.odd_bg as string) ?? "#f3f4f6";
  const oddText = (lb.odd_text as string) ?? "#374151";
  const evenBg = (lb.even_bg as string) ?? "#ffffff";
  const evenText = (lb.even_text as string) ?? "#222222";

  // Fetch top subscribers
  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("id, email, name, referral_count")
    .eq("waitlist_id", waitlist.id)
    .eq("status", "active")
    .order("referral_count", { ascending: false })
    .limit(usersLimit);

  const entries = (subscribers ?? []).map((s, i) => ({
    position: i + 1,
    email: s.email,
    name: s.name ?? s.email.split("@")[0],
    referral_count: s.referral_count,
  }));

  const rowsHtml = entries
    .map(
      (entry, i) => `
    <tr style="background:${i % 2 === 0 ? oddBg : evenBg};color:${i % 2 === 0 ? oddText : evenText};">
      ${showPosition ? `<td style="padding:8px 12px;font-size:14px;">#${entry.position}</td>` : ""}
      ${showName ? `<td style="padding:8px 12px;font-size:14px;">${escapeHtml(entry.name)}</td>` : ""}
      <td style="padding:8px 12px;font-size:14px;">${escapeHtml(entry.email)}</td>
      ${showReferralCount ? `<td style="padding:8px 12px;font-size:14px;text-align:right;">${entry.referral_count}</td>` : ""}
    </tr>`,
    )
    .join("\n");

  const titleHtml = showTitle
    ? `
    <div style="padding:16px;text-align:center;">
      <h2 style="margin:0;font-size:18px;color:${oddText};">${escapeHtml(title)}</h2>
      ${subtitle ? `<p style="margin:4px 0 0;font-size:14px;color:#6b7280;">${escapeHtml(subtitle)}</p>` : ""}
    </div>`
    : "";

  const headerCols = [
    showPosition ? `<th style="padding:8px 12px;text-align:left;font-size:13px;font-weight:600;">#</th>` : "",
    showName ? `<th style="padding:8px 12px;text-align:left;font-size:13px;font-weight:600;">Name</th>` : "",
    `<th style="padding:8px 12px;text-align:left;font-size:13px;font-weight:600;">Email</th>`,
    showReferralCount ? `<th style="padding:8px 12px;text-align:right;font-size:13px;font-weight:600;">Ref</th>` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: transparent; }
    table { width: 100%; border-collapse: collapse; }
  </style>
</head>
<body>
  ${titleHtml}
  <table>
    <thead>
      <tr style="background:${headerBg};color:${headerText};">
        ${headerCols}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
  ${entries.length === 0 ? '<p style="text-align:center;padding:24px;color:#9ca3af;font-size:14px;">No subscribers yet</p>' : ""}
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
