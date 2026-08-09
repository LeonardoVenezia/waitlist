import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateTurnstileToken } from "@/lib/api/validate-turnstile";
import { checkRateLimit } from "@/lib/api/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    form_id,
    project_id,
    name,
    email,
    company,
    role,
    message,
    rating,
    turnstile_token,
  } = body;

  if (!form_id || !project_id || !name || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify Turnstile
  if (turnstile_token && typeof turnstile_token === "string") {
    const valid = await validateTurnstileToken(turnstile_token);
    if (!valid) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
  }

  const admin = createAdminClient();

  // Verify form exists and is published
  const { data: form } = await admin
    .from("testimonial_forms")
    .select("id, project_id")
    .eq("id", form_id as string)
    .eq("status", "published")
    .maybeSingle();

  if (!form || form.project_id !== project_id) {
    return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  }

  const { error } = await admin.from("testimonials").insert({
    project_id: project_id as string,
    form_id: form_id as string,
    name: name as string,
    email: (email as string) ?? null,
    company: (company as string) ?? null,
    role: (role as string) ?? null,
    message: message as string,
    rating: typeof rating === "number" ? rating : 5,
    source: "form",
    status: "approved",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
