import { createHash } from "crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

type TestimonialFormRow = Database["public"]["Tables"]["testimonial_forms"]["Row"];

export async function getPublicForm(slug: string): Promise<TestimonialFormRow | null> {
  const admin = createAdminClient();
  const { data: form } = await admin
    .from("testimonial_forms")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return form ?? null;
}

/**
 * Records a unique visit for the form. Dedup key is a daily-rotated hash of
 * ip + user-agent — no PII is stored. Failures are swallowed: visit tracking
 * must never block the form from rendering.
 */
export async function trackFormVisit(formId: string) {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const ua = h.get("user-agent") ?? "";
    const day = new Date().toISOString().slice(0, 10);
    const hash = createHash("sha256").update(`${ip}|${ua}|${day}`).digest("hex");

    const admin = createAdminClient();
    await admin
      .from("testimonial_form_visits")
      .upsert({ form_id: formId, visitor_hash: hash }, { onConflict: "form_id,visitor_hash" });
  } catch (e) {
    console.error("visit tracking failed:", e);
  }
}

/** Marks the invite as opened when the recipient lands on the form. */
export async function markInviteOpened(token: string | undefined) {
  if (!token) return;
  try {
    const admin = createAdminClient();
    await admin
      .from("testimonial_invites")
      .update({ status: "opened", opened_at: new Date().toISOString() })
      .eq("token", token)
      .in("status", ["queued", "sent"]);
  } catch (e) {
    console.error("invite open tracking failed:", e);
  }
}

export function parseFormFields(form: TestimonialFormRow): string[] {
  const rawFields = form.fields as unknown;
  return Array.isArray(rawFields)
    ? (rawFields as Array<unknown>).filter((f): f is string => typeof f === "string")
    : [];
}

export function parseThankYouMessage(form: TestimonialFormRow): string | null {
  const design = (form.design ?? {}) as { thank_you_message?: string };
  return design.thank_you_message ?? null;
}
