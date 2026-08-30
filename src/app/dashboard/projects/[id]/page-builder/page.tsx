import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { Plan } from "@/lib/plans";
import { getSubscriberCount } from "@/lib/api/position";
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
  const realCount = await getSubscriberCount(waitlist.id);

  return (
    <PageBuilderClient
      waitlistId={waitlist.id}
      slug={waitlist.slug}
      publicKey={waitlist.public_key}
      realCount={realCount}
      plan={waitlist.plan as Plan}
      initialSections={(pageSections.sections as Section[]) ?? []}
      initialGlobal={migrateGlobal(pageSections.global as Partial<GlobalSettings>)}
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

// ponytail: migrate defaults from old cream/blue to new cream/bordeaux
// on first render. Covers users who already saved with the old defaults
// (bg #f9fafb / button #0ea5e9) — those values are treated as "unset".
const LEGACY_BG = "#f9fafb";
const LEGACY_BUTTON = "#0ea5e9";

export const defaultGlobal: GlobalSettings = {
  bg_color: "#fbf8f3",
  button_color: "oklch(0.48 0.19 70)", // keep in sync with --primary in globals.css
  button_text_color: "#fffaf3",
  show_count: true,
  show_leaderboard: true,
  show_social_links: false,
  referral_source: "hosted_page",
  seo_title: "",
  seo_description: "",
  seo_indexable: true,
  page_enabled: true,
};

export function migrateGlobal(stored: Partial<GlobalSettings> | null | undefined): GlobalSettings {
  const g = { ...defaultGlobal, ...(stored ?? {}) };
  if (g.bg_color === LEGACY_BG) g.bg_color = defaultGlobal.bg_color;
  if (g.button_color === LEGACY_BUTTON) g.button_color = defaultGlobal.button_color;
  return g;
}
