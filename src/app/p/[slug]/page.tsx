import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublicWaitlistForm } from "./public-waitlist-form";
import { PageViewTracker } from "@/components/shared/page-view-tracker";

function MilestonesDisplay({ milestones }: { milestones: Array<{ count: number; reward: string }> }) {
  if (!milestones || milestones.length === 0) return null;
  return (
    <div className="rounded-xl border bg-card p-4 mt-4">
      <h3 className="text-sm font-semibold mb-2">Rewards</h3>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {milestones.map((m, i) => (
          <li key={i}>🎁 {m.reward} at {m.count} referrals</li>
        ))}
      </ul>
    </div>
  );
}

interface PageSection {
  id: string;
  type: "hero" | "features" | "how_it_works" | "faq" | "form" | "media_text";
  visible: boolean;
  order: number;
  settings: Record<string, unknown>;
}

interface PageGlobal {
  bg_color: string;
  button_color: string;
  button_text_color: string;
  show_count: boolean;
  show_leaderboard: boolean;
  show_social_links: boolean;
  referral_source: string;
  seo_title: string;
  seo_description: string;
  seo_indexable: boolean;
  page_enabled: boolean;
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = createAdminClient();
  const { data: waitlist } = await supabase
    .from("projects")
    .select("name, settings")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!waitlist) return { title: "Not Found" };

  const settings = (waitlist.settings as Record<string, unknown>) ?? {};
  const pageSections = (settings.page_sections as Record<string, unknown>) ?? {};
  const global = (pageSections.global as PageGlobal) ?? {};
  const heroSection = ((pageSections.sections as PageSection[]) ?? []).find(
    (s) => s.type === "hero" && s.visible,
  );
  const heroTitle = (heroSection?.settings?.title as string) || waitlist.name;

  return {
    title: global.seo_title || heroTitle,
    description: global.seo_description || heroTitle,
    robots: global.seo_indexable === false ? "noindex, nofollow" : undefined,
  };
}

export default async function HostedPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const supabase = createAdminClient();

  const { data: waitlist } = await supabase
    .from("projects")
    .select("id, name, slug, public_key, settings")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!waitlist) notFound();

  const settings = (waitlist.settings as Record<string, unknown>) ?? {};
  const pageSections =
    (settings.page_sections as { sections?: PageSection[]; global?: PageGlobal }) ?? {};

  const sections = pageSections.sections ?? [];
  const global = pageSections.global ?? ({} as PageGlobal);

  // If page is explicitly disabled, 404
  if (global.page_enabled === false) notFound();

  // If page_sections exist, render page builder
  if (sections.length > 0) {
    const visibleSections = sections
      .filter((s) => s.visible)
      .sort((a, b) => a.order - b.order);

    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: global.bg_color ?? "#f9fafb" }}
      >
        <PageViewTracker waitlistId={waitlist.id} />
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
          {visibleSections.map((section) => {
            const s = section.settings ?? {};
            switch (section.type) {
              case "hero":
                return (
                  <section
                    key={section.id}
                    className="text-center py-12 space-y-4"
                  >
                    <h1 className="text-3xl font-bold">
                      {(s.title as string) || waitlist.name}
                    </h1>
                    {(s.subtitle as string) && (
                      <p className="text-muted-foreground">
                        {s.subtitle as string}
                      </p>
                    )}
                    <PublicWaitlistForm
                      publicKey={waitlist.public_key}
                      waitlistId={waitlist.id}
                      settings={settings}
                      slug={waitlist.slug}
                      ctaLabel={(s.cta_label as string) || "Join the waitlist"}
                      buttonColor={global.button_color ?? "#0ea5e9"}
                      buttonTextColor={global.button_text_color ?? "#ffffff"}
                      showCount={global.show_count ?? true}
                      showLeaderboard={global.show_leaderboard ?? true}
                    />
                  </section>
                );

              case "features": {
                const items =
                  (s.items as Array<{
                    icon: string;
                    title: string;
                    description: string;
                  }>) ?? [];
                return (
                  <section key={section.id} className="py-8 space-y-6">
                    {(s.title as string) && (
                      <h2 className="text-2xl font-bold text-center">
                        {s.title as string}
                      </h2>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {items.map((item, i) => (
                        <div
                          key={i}
                          className="text-center p-4 rounded-xl bg-card border"
                        >
                          <div className="text-2xl mb-2">
                            {item.icon || "✨"}
                          </div>
                          <h3 className="font-semibold">
                            {item.title || "Feature"}
                          </h3>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                );
              }

              case "how_it_works": {
                const steps =
                  (s.steps as Array<{
                    icon: string;
                    title: string;
                    description: string;
                  }>) ?? [];
                return (
                  <section key={section.id} className="py-8 space-y-6">
                    {(s.title as string) && (
                      <h2 className="text-2xl font-bold text-center">
                        {s.title as string}
                      </h2>
                    )}
                    <div className="space-y-4">
                      {steps.map((step, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-4 p-4 rounded-xl bg-card border"
                        >
                          <div className="text-2xl flex-shrink-0">
                            {step.icon || "1️⃣"}
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {step.title || `Step ${i + 1}`}
                            </h3>
                            {step.description && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {step.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              }

              case "faq": {
                const questions =
                  (s.questions as Array<{
                    question: string;
                    answer: string;
                  }>) ?? [];
                return (
                  <section
                    key={section.id}
                    className="py-8 space-y-4 max-w-xl mx-auto"
                  >
                    {(s.title as string) && (
                      <h2 className="text-2xl font-bold text-center">
                        {s.title as string}
                      </h2>
                    )}
                    <div className="space-y-2">
                      {questions.map((q, i) => (
                        <details key={i} className="group rounded-xl bg-card border">
                          <summary className="flex items-center justify-between p-4 cursor-pointer select-none font-medium list-none">
                            {q.question || "Question"}
                            <svg className="size-4 text-muted-foreground transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                          </summary>
                          {q.answer && <p className="px-4 pb-4 text-sm text-muted-foreground">{q.answer}</p>}
                        </details>
                      ))}
                    </div>
                  </section>
                );
              }

              case "form":
                return (
                  <section
                    key={section.id}
                    className="py-8 max-w-sm mx-auto space-y-4 text-center"
                  >
                    {(s.title as string) && (
                      <h2 className="text-xl font-bold">
                        {s.title as string}
                      </h2>
                    )}
                    {(s.subtitle as string) && (
                      <p className="text-sm text-muted-foreground">
                        {s.subtitle as string}
                      </p>
                    )}
                    <PublicWaitlistForm
                      publicKey={waitlist.public_key}
                      waitlistId={waitlist.id}
                      settings={settings}
                      slug={waitlist.slug}
                      ctaLabel="Join the waitlist"
                      buttonColor={global.button_color ?? "#0ea5e9"}
                      buttonTextColor={global.button_text_color ?? "#ffffff"}
                      showCount={global.show_count ?? true}
                      showLeaderboard={global.show_leaderboard ?? true}
                    />
                  </section>
                );

              case "media_text": {
                const imagePath = (s.image as string) || "";
                const imageSide = (s.image_side as string) || "left";
                const isLeft = imageSide === "left";
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";
                const imageUrl = imagePath
                  ? imagePath.startsWith("http") ? imagePath : `${supabaseUrl}/storage/v1/object/public/showcase-images/${imagePath}`
                  : "";
                return (
                  <section key={section.id} className="py-8 max-w-3xl mx-auto">
                    <div className={`flex flex-col ${isLeft ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-8`}>
                      {imageUrl ? (
                        <div className="w-full md:w-1/2">
                          <img src={imageUrl} alt="" className="w-full rounded-xl object-cover aspect-video bg-muted" />
                        </div>
                      ) : (
                        <div className="w-full md:w-1/2 bg-muted rounded-xl aspect-video" />
                      )}
                      <div className="w-full md:w-1/2 space-y-3">
                        {(s.title as string) && <h2 className="text-2xl font-bold">{(s.title as string)}</h2>}
                        {(s.text as string) && <p className="text-sm text-muted-foreground whitespace-pre-line">{(s.text as string)}</p>}
                      </div>
                    </div>
                  </section>
                );
              }
            }
          })}
          {(settings.referral as { reward_text?: string })?.reward_text && (
            <p className="text-sm text-center text-muted-foreground mt-4">
              {(settings.referral as { reward_text?: string }).reward_text}
            </p>
          )}
          <MilestonesDisplay milestones={(settings.referral as { milestones?: Array<{ count: number; reward: string }> })?.milestones ?? []} />
        </div>
      </div>
    );
  }

  // Fallback: classic hosted page
  const branding = (settings.branding ?? {}) as Record<string, unknown>;
  const hero = (settings.hero ?? {}) as Record<string, unknown>;
  const primaryColor = (branding.primary_color as string) ?? "#22c563";

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ "--wl-primary": primaryColor } as React.CSSProperties}
    >
      <PageViewTracker waitlistId={waitlist.id} />
      <div className="w-full max-w-md space-y-6 text-center">
        {(branding.logo_url as string) && (
          <img
            src={branding.logo_url as string}
            alt={waitlist.name}
            className="mx-auto h-12 w-auto"
          />
        )}
        <h1 className="text-3xl">
          {(hero.title as string) || waitlist.name}
        </h1>
        {(hero.subtitle as string) && (
          <p className="text-muted-foreground">{hero.subtitle as string}</p>
        )}
        <PublicWaitlistForm
          publicKey={waitlist.public_key}
          waitlistId={waitlist.id}
          settings={settings}
          slug={waitlist.slug}
          ctaLabel={(hero.cta_label as string) || "Join the waitlist"}
          buttonColor={primaryColor}
          buttonTextColor="#ffffff"
        />
        {(settings.referral as { reward_text?: string })?.reward_text && (
          <p className="text-sm text-center text-muted-foreground mt-4">
            {(settings.referral as { reward_text?: string }).reward_text}
          </p>
        )}
        <MilestonesDisplay milestones={(settings.referral as { milestones?: Array<{ count: number; reward: string }> })?.milestones ?? []} />
      </div>
    </div>
  );
}
