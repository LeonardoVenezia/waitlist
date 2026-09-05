import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateTurnstileToken } from "@/lib/api/validate-turnstile";
import { checkRateLimit } from "@/lib/api/rate-limit";

const MAX_ANSWER_LENGTH = 1000;

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

  // Turnstile is mandatory whenever the server-side secret is configured.
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
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
    name: name as string,
    email: (email as string) ?? null,
    company: (company as string) ?? null,
    role: (role as string) ?? null,
    message: message as string,
    rating: typeof rating === "number" ? rating : 5,
    source: "form",
    // Manual moderation (default): hold for owner approval. Auto: publish.
    status: form.moderation === "auto" ? "approved" : "pending",
    answers,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
