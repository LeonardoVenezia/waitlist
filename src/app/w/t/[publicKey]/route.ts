import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasFeature } from "@/lib/plans";
import {
  buildTestimonialWidgetHtml,
  isTestimonialWidgetVariant,
  VARIANT_LIMIT,
  type TestimonialWidgetVariant,
} from "@/lib/testimonials/widget-html";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ publicKey: string }> },
) {
  const { publicKey } = await params;
  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("id, status, plan, settings")
    .eq("public_key", publicKey)
    .eq("status", "active")
    .maybeSingle();

  if (!project) return new NextResponse("Not found", { status: 404 });

  // Variant comes from the project's saved widget settings; `?variant=` lets
  // the dashboard preview each one without persisting it first.
  const settings = (project.settings as Record<string, unknown> | null) ?? {};
  const widgetSettings = (settings.testimonial_widget as Record<string, unknown> | null) ?? {};
  const requested = new URL(request.url).searchParams.get("variant") ?? "";
  const configured = typeof widgetSettings.variant === "string" ? widgetSettings.variant : "grid";
  const variant: TestimonialWidgetVariant = isTestimonialWidgetVariant(requested)
    ? requested
    : isTestimonialWidgetVariant(configured)
      ? configured
      : "grid";

  const { data: testimonials } = await admin
    .from("testimonials")
    .select("name, company, role, message, rating, avatar_url, is_featured")
    .eq("project_id", project.id)
    .eq("status", "approved")
    .eq("consent", "public")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(VARIANT_LIMIT[variant]);

  const html = buildTestimonialWidgetHtml({
    testimonials: testimonials ?? [],
    variant,
    showBranding: !hasFeature(project.plan, "remove_branding"),
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
