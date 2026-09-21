import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateTurnstileToken } from "@/lib/api/validate-turnstile";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { TURNSTILE_ENABLED } from "@/lib/turnstile";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Issues a signed upload URL so an anonymous testimonial author can upload
 * their photo / company logo directly to the `showcase-images` bucket (same
 * protocol as the showcase and page-builder uploaders).
 *
 * Protecteurs: IP rate-limit, Turnstile (when configured) and the form must
 * exist and be published. The path is scoped to `testimonials/<formId>/` so it
 * can never escape that folder.
 */
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

  // `fileType` is the contract shared with the other signed-URL routes
  // (page builder / showcase), which is what `ImageUpload` sends.
  const { form_id: formId, fileType, turnstile_token: turnstileToken } = body;

  if (typeof formId !== "string" || typeof fileType !== "string") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(fileType)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  // Turnstile is mandatory whenever the server-side secret is configured.
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (TURNSTILE_ENABLED && turnstileSecret) {
    if (typeof turnstileToken !== "string" || !turnstileToken) {
      return NextResponse.json({ error: "Verification required" }, { status: 400 });
    }
    const valid = await validateTurnstileToken(turnstileToken);
    if (!valid) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
  }

  const admin = createAdminClient();

  // Only allow uploads for an existing, published form.
  const { data: form } = await admin
    .from("testimonial_forms")
    .select("id")
    .eq("id", formId)
    .eq("status", "published")
    .maybeSingle();

  if (!form) {
    return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  }

  const ext = EXT_MAP[fileType] ?? "jpg";
  const path = `testimonials/${formId}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  const { data, error } = await admin.storage
    .from("showcase-images")
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ path, signedUrl: data.signedUrl, token: data.token });
}
