import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ publicKey: string }> },
) {
  const { publicKey } = await params;

  const supabase = createAdminClient();

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("name, slug, settings")
    .eq("public_key", publicKey)
    .eq("status", "active")
    .maybeSingle();

  if (!waitlist) {
    return NextResponse.json(
      { error: "Waitlist not found" },
      { status: 404 },
    );
  }

  // Only expose what the widget/hosted page needs
  return NextResponse.json({
    name: waitlist.name,
    slug: waitlist.slug,
    settings: waitlist.settings,
  });
}
