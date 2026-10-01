import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { waitlist_id } = await request.json();
    if (typeof waitlist_id !== "string") {
      return NextResponse.json({ error: "waitlist_id required" }, { status: 400 });
    }

    const referer = request.headers.get("referer");
    const origin = request.headers.get("origin");
    const appOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL ?? request.url).origin;
    if (!referer || origin !== appOrigin) {
      return NextResponse.json({ error: "Hosted page origin required" }, { status: 403 });
    }
    const refererUrl = new URL(referer);
    if (refererUrl.origin !== appOrigin || !/^\/p\/[^/]+\/?$/.test(refererUrl.pathname)) {
      return NextResponse.json({ error: "Hosted page origin required" }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", waitlist_id)
      .eq("slug", refererUrl.pathname.split("/")[2])
      .eq("status", "active")
      .maybeSingle();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { error } = await supabase.from("page_events").insert({
      waitlist_id: project.id,
      type: "view",
      source: "hosted",
    });
    if (error) console.error("Hosted page-view tracking failed:", error.message);

    return NextResponse.json({ ok: !error });
  } catch (error) {
    console.error("Hosted page-view tracking failed:", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
