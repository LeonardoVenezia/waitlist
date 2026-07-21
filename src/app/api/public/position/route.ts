import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSubscriberPosition } from "@/lib/api/position";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publicKey = searchParams.get("public_key");
  const code = searchParams.get("code");

  if (!publicKey || !code) {
    return NextResponse.json(
      { error: "Missing public_key or code" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Find waitlist by public key
  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id")
    .eq("public_key", publicKey)
    .eq("status", "active")
    .maybeSingle();

  if (!waitlist) {
    return NextResponse.json(
      { error: "Invalid public key" },
      { status: 404 },
    );
  }

  // Find subscriber by referral code
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("id, referral_count")
    .eq("waitlist_id", waitlist.id)
    .eq("referral_code", code)
    .maybeSingle();

  if (!subscriber) {
    return NextResponse.json(
      { error: "Subscriber not found" },
      { status: 404 },
    );
  }

  const position = await getSubscriberPosition(subscriber.id);

  return NextResponse.json({
    position,
    referral_count: subscriber.referral_count,
  });
}
