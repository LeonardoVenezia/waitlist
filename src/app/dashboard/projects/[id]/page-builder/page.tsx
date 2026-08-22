import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { Plan } from "@/lib/plans";
import { PageBuilderClient } from "./page-builder-client";

export default async function PageBuilderPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: waitlist } = await supabase
    .from("projects")
    .select("id, name, slug, public_key, plan, settings")
    .eq("id", id)
    .maybeSingle();

  if (!waitlist) notFound();

  const settings = (waitlist.settings as Record<string, unknown>) ?? {};
  const pageSections = (settings.page_sections as Record<string, unknown>) ?? {};

  return (
    <PageBuilderClient
      waitlistId={waitlist.id}
      slug={waitlist.slug}
      plan={waitlist.plan as Plan}
      initialSections={(pageSections.sections as Section[]) ?? []}
      initialGlobal={(pageSections.global as GlobalSettings) ?? defaultGlobal}
      initialTemplateId={(pageSections.template_id as string | null) ?? null}
      initialTemplateData={pageSections.template_data}
    />
  );
}

export interface Section {
  id: string;
  type: "hero" | "features" | "how_it_works" | "faq" | "form" | "media_text";
  visible: boolean;
  order: number;
  settings: Record<string, unknown>;
}

export interface GlobalSettings {
  bg_color: string;
  button_color: string;
  button_text_color: string;
  show_count: boolean;
  show_leaderboard: boolean;
  show_social_links: boolean;
  referral_source: "website" | "hosted_page";
  seo_title: string;
  seo_description: string;
  seo_indexable: boolean;
  page_enabled: boolean;
}

const defaultGlobal: GlobalSettings = {
  bg_color: "#f9fafb",
  button_color: "#0ea5e9",
  button_text_color: "#ffffff",
  show_count: true,
  show_leaderboard: true,
  show_social_links: false,
  referral_source: "hosted_page",
  seo_title: "",
  seo_description: "",
  seo_indexable: true,
  page_enabled: true,
};
