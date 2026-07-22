import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyToken } from "@/lib/api/verify-token";
import { jsonResponse, corsOptionsResponse } from "@/lib/api/cors";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return jsonResponse({ error: "Missing token" }, { status: 400 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return jsonResponse(
      { error: "Invalid or expired verification link" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("subscribers")
    .update({ verified: true })
    .eq("id", payload.subscriberId)
    .eq("email", payload.email);

  if (error) {
    return jsonResponse(
      { error: "Failed to verify email" },
      { status: 500 },
    );
  }

  // Redirect to a success page
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}?verified=1`);
}
