import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonResponse, corsOptionsResponse } from "@/lib/api/cors";
import type { Json } from "@/lib/supabase/types";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function PATCH(request: Request) {
  const supabase = createAdminClient();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
  }

  const subscriberId = body.subscriber_id as string | undefined;
  const answers = body.answers as Record<string, string> | undefined;

  if (!subscriberId || !answers || Object.keys(answers).length === 0) {
    return jsonResponse({ error: "subscriber_id and answers are required" }, { status: 400 });
  }

  // Fetch current subscriber to validate and get existing metadata
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("id, status, metadata")
    .eq("id", subscriberId)
    .maybeSingle();

  if (!subscriber) {
    return jsonResponse({ error: "Subscriber not found" }, { status: 404 });
  }

  if (subscriber.status !== "active") {
    return jsonResponse({ error: "Subscriber is not active" }, { status: 403 });
  }

  // Merge answers into metadata
  const metadata = (subscriber.metadata as Record<string, unknown>) ?? {};
  metadata.post_signup_answers = answers;

  const { error } = await supabase
    .from("subscribers")
    .update({ metadata: metadata as unknown as Json })
    .eq("id", subscriberId);

  if (error) {
    return jsonResponse({ error: error.message }, { status: 500 });
  }

  return jsonResponse({ success: true });
}
