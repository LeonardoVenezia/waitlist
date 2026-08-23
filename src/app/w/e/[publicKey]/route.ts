import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTemplateDefinition } from "@/lib/templates";
import { buildWidgetHtml } from "@/lib/widget-html";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ publicKey: string }> },
) {
  const { publicKey } = await params;
  const supabase = createAdminClient();

  const { data: waitlist } = await supabase
    .from("projects")
    .select("id, name, slug, public_key, plan, settings")
    .eq("public_key", publicKey)
    .eq("status", "active")
    .maybeSingle();

  if (!waitlist) {
    return new NextResponse("Not found", { status: 404 });
  }

  const settings = (waitlist.settings as Record<string, unknown>) ?? {};
  const widget = (settings.widget ?? {}) as Record<string, unknown>;
  const mode = (widget.mode as string) ?? "custom";
  const pageSections = (settings.page_sections as Record<string, unknown>) ?? {};
  const templateDefinition = getTemplateDefinition(pageSections.template_id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (mode === "template" && templateDefinition) {
    return NextResponse.redirect(
      `${appUrl}/p/${waitlist.slug}?embed=1&from=widget`,
    );
  }

  const thankYou = (settings.thank_you ?? {}) as Record<string, unknown>;
  const html = buildWidgetHtml({
    publicKey: waitlist.public_key,
    appUrl,
    plan: waitlist.plan,
    widget,
    thankYou,
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
