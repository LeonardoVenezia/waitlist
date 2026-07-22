import { createAdminClient } from "@/lib/supabase/admin";
import { jsonResponse, corsOptionsResponse } from "@/lib/api/cors";

export async function OPTIONS() {
  return corsOptionsResponse();
}

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
    return jsonResponse(
      { error: "Waitlist not found" },
      { status: 404 },
    );
  }

  // Only expose what the widget/hosted page needs
  return jsonResponse({
    name: waitlist.name,
    slug: waitlist.slug,
    settings: waitlist.settings,
  });
}
