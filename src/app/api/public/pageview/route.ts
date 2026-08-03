import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { waitlist_id, type } = await request.json();
    if (!waitlist_id || !type) {
      return NextResponse.json({ error: "waitlist_id and type required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    await supabase.from("page_events").insert({
      waitlist_id,
      type: type === "signup" ? "signup" : "view",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // silently ignore errors
  }
}
