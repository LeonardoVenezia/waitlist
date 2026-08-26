import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Basic email validation: check format, disposable domains, common typos
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", "10minutemail.com",
  "yopmail.com", "throwaway.email", "sharklasers.com", "trashmail.com",
  "temp-mail.org", "fakeinbox.com", "emailondeck.com", "getnada.com",
]);

function validateEmailQuality(email: string): {
  status: "deliverable" | "risky" | "undeliverable" | "unknown";
} {
  const parts = email.split("@");
  if (parts.length !== 2) return { status: "undeliverable" };

  const [, domain] = parts;
  if (!domain.includes(".") || domain.length < 4)
    return { status: "undeliverable" };

  if (DISPOSABLE_DOMAINS.has(domain.toLowerCase()))
    return { status: "undeliverable" };

  // Check for common risky patterns
  if (domain.endsWith(".xyz") || domain.endsWith(".tk") || domain.endsWith(".ml"))
    return { status: "risky" };

  return { status: "deliverable" };
}

export async function POST(request: Request) {
  try {
    const { subscriberId } = await request.json();
    if (!subscriberId) {
      return NextResponse.json({ error: "subscriberId required" }, { status: 400 });
    }

    const supabase = await createClient();

    // RLS-protected read: only visible if the caller owns the parent project
    const { data: sub } = await supabase
      .from("subscribers")
      .select("id, email")
      .eq("id", subscriberId)
      .maybeSingle();

    if (!sub) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    const { status } = validateEmailQuality(sub.email);

    const admin = createAdminClient();
    await admin
      .from("subscribers")
      .update({ email_status: status })
      .eq("id", subscriberId);

    return NextResponse.json({ status, email: sub.email });
  } catch {
    return NextResponse.json(
      { error: "Validation failed" },
      { status: 500 },
    );
  }
}
