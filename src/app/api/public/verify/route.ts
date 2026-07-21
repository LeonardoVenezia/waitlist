import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyToken } from "@/lib/api/verify-token";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json(
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
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 },
    );
  }

  // Redirect to a success page
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}?verified=1`);
}
