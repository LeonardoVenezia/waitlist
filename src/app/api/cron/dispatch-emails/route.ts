import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { renderShowcaseExpiryEmail } from "@/emails/showcase-expiry";

const BATCH_SIZE = 50;

export async function POST(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: pending, error } = await supabase
    .from("email_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("Failed to read email_queue:", error);
    return NextResponse.json({ error: "Failed to read queue" }, { status: 500 });
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://waitlist.leovenezia.dev";
  let sent = 0;
  let failed = 0;

  for (const row of pending) {
    const payload = (row.payload ?? {}) as {
      showcase_id?: string;
      showcase_name?: string;
      project_id?: string;
      expires_at?: string;
    };

    let html = "";
    if (row.template === "showcase-expiry-30d" || row.template === "showcase-expiry-7d") {
      const daysLeft: 30 | 7 = row.template === "showcase-expiry-30d" ? 30 : 7;
      html = renderShowcaseExpiryEmail({
        daysLeft,
        productName: payload.showcase_name ?? "tu producto",
        upgradeUrl: payload.project_id
          ? `${appUrl}/dashboard/projects/${payload.project_id}/upgrade`
          : `${appUrl}/dashboard`,
      });
    } else {
      html = `<p>${row.subject}</p>`;
    }

    const result = await sendEmail({
      to: row.to_email,
      subject: row.subject,
      html,
    });

    if (result.ok) {
      await supabase
        .from("email_queue")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      sent += 1;
    } else {
      await supabase
        .from("email_queue")
        .update({
          status: "failed",
          attempts: (row.attempts ?? 0) + 1,
          last_error: result.error ?? "unknown",
        })
        .eq("id", row.id);
      failed += 1;
    }
  }

  return NextResponse.json({ processed: pending.length, sent, failed });
}

export async function GET(request: Request) {
  return POST(request);
}
