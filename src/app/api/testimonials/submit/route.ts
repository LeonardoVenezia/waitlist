import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateTurnstileToken } from "@/lib/api/validate-turnstile";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { TURNSTILE_ENABLED } from "@/lib/turnstile";

const MAX_ANSWER_LENGTH = 1000;

/** Trims a string field and caps its length. Empty/blank → null. */
function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

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
    turnstile_token,
    invite_token,
    rating,
  } = body;

  const name = str(body.name, 200);
  const message = str(body.message, 5000);
  const email = str(body.email, 320);
  const company = str(body.company, 200);
  const role = str(body.role, 200);
  const website = str(body.website, 500);
  const avatar_url = str(body.avatar_url, 500);
  const company_logo_url = str(body.company_logo_url, 500);
  const private_feedback = str(body.private_feedback, 2000);
  const consent =
    body.consent === "public" || body.consent === "private" ? body.consent : null;

  if (!form_id || !project_id || !name || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Turnstile is mandatory whenever the server-side secret is configured.
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (TURNSTILE_ENABLED && turnstileSecret) {
    if (typeof turnstile_token !== "string" || !turnstile_token) {
      return NextResponse.json({ error: "Verification required" }, { status: 400 });
    }
    const valid = await validateTurnstileToken(turnstile_token);
    if (!valid) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
  }

  const admin = createAdminClient();

  // Verify form exists, is published, and matches the project. Also read its
  // moderation setting and questions (to map `question_<i>` keys to labels).
  const { data: form } = await admin
    .from("testimonial_forms")
    .select("id, project_id, moderation, questions")
    .eq("id", form_id as string)
    .eq("status", "published")
    .maybeSingle();

  if (!form || form.project_id !== project_id) {
    return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  }

  // Collect answers to the form's custom questions (keys `question_<i>`) and
  // store them keyed by the question's label for readable display. Values are
  // validated server-side: string, trimmed, capped length.
  const questions = Array.isArray(form.questions)
    ? (form.questions as Array<{ label?: string }>)
    : [];
  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    if (!key.startsWith("question_")) continue;
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    const index = Number(key.slice("question_".length));
    const label = questions[index]?.label ?? key;
    answers[label] = trimmed.slice(0, MAX_ANSWER_LENGTH);
  }

  const { error } = await admin.from("testimonials").insert({
    project_id: project_id as string,
    form_id: form_id as string,
    name,
    email,
    company,
    role,
    website,
    message,
    rating: typeof rating === "number" ? rating : 5,
    avatar_url,
    company_logo_url,
    private_feedback,
    consent,
    source: "form",
    // Manual moderation (default): hold for owner approval. Auto: publish.
    status: form.moderation === "auto" ? "approved" : "pending",
    answers,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark the invite as submitted (best-effort — the testimonial is already in).
  if (typeof invite_token === "string" && invite_token) {
    await admin
      .from("testimonial_invites")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("token", invite_token)
      .in("status", ["queued", "sent", "opened"]);
  }

  return NextResponse.json({ success: true });
}
