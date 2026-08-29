import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSubscriberCount } from "@/lib/api/position";
import {
  getTemplateDefinition,
  normalizeTemplateData,
} from "@/lib/templates";
import { TemplateRenderer } from "@/components/templates/template-renderer";

export const dynamic = "force-dynamic";

// Auth-gated full-page preview of a project's waitlist. Renders the same
// template the public /p/[slug] uses, but with `preview=true` so the
// subscribe hook returns a mock result instead of inserting a subscriber.
export default async function PreviewPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  // Auth check: must be signed in.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/preview/${slug}`);

  // Load project (RLS-enforced; only the owner can read it).
  const { data: project, error: projectErr } = await supabase
    .from("projects")
    .select("id, account_id, name, slug, public_key, status, settings, accounts!inner(owner_id)")
    .eq("slug", slug)
    .maybeSingle();

  if (projectErr || !project) notFound();

  const ownerId = (project as unknown as {
    accounts: { owner_id: string };
  }).accounts?.owner_id;
  if (ownerId !== user.id) notFound();

  const settings = (project.settings as Record<string, unknown>) ?? {};
  const pageSections = (settings.page_sections as Record<string, unknown>) ?? {};
  const realCount = await getSubscriberCount(project.id);

  // Custom builder path: render the sections with the project's global colors.
  const sections = (pageSections.sections as Array<{
    id: string;
    type: "hero" | "features" | "how_it_works" | "faq" | "form" | "media_text";
    visible: boolean;
    order: number;
    settings: Record<string, unknown>;
  }>) ?? [];
  const rawGlobal = (pageSections.global as {
    bg_color?: string;
    button_color?: string;
    button_text_color?: string;
    show_count?: boolean;
    show_leaderboard?: boolean;
    page_enabled?: boolean;
  }) ?? {};
  const global = {
    bg_color: rawGlobal.bg_color && rawGlobal.bg_color !== "#f9fafb" ? rawGlobal.bg_color : "#fbf8f3",
    button_color:
      rawGlobal.button_color && rawGlobal.button_color !== "#0ea5e9"
        ? rawGlobal.button_color
        : "#7a3325",
    button_text_color: rawGlobal.button_text_color ?? "#fffaf3",
    show_count: rawGlobal.show_count ?? true,
    show_leaderboard: rawGlobal.show_leaderboard ?? true,
    page_enabled: rawGlobal.page_enabled ?? true,
  };

  const templateDefinition = getTemplateDefinition(pageSections.template_id);

  return (
    <div className="relative">
      {/* Preview banner: makes it clear this is a no-side-effect preview
          and gives a way back to the dashboard. */}
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b bg-amber-50 px-4 py-2 text-sm text-amber-900">
        <span>
          <strong>Preview</strong> — submissions here are not recorded. This page is
          only visible to you.
        </span>
        <Link
          href={`/dashboard/projects/${project.id}/page-builder`}
          className="rounded-md border border-amber-900/20 bg-white px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors"
        >
          Back to editor
        </Link>
      </div>

      {templateDefinition ? (
        <TemplateRenderer
          templateId={templateDefinition.id}
          templateData={normalizeTemplateData(
            templateDefinition.id,
            pageSections.template_data,
          )}
          publicKey={project.public_key}
          realCount={realCount}
          preview
        />
      ) : global.page_enabled === false ? (
        <div className="flex min-h-[50vh] items-center justify-center p-8 text-center text-muted-foreground">
          This page is currently disabled in the editor.
        </div>
      ) : sections.length > 0 ? (
        <div
          className="min-h-screen"
          style={{ backgroundColor: global.bg_color }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
            <SectionsPreview sections={sections} global={global} />
          </div>
        </div>
      ) : (
        <EmptyPreview projectName={project.name} />
      )}
    </div>
  );
}

function SectionsPreview({
  sections,
  global,
}: {
  sections: Array<{
    id: string;
    type: "hero" | "features" | "how_it_works" | "faq" | "form" | "media_text";
    visible: boolean;
    order: number;
    settings: Record<string, unknown>;
  }>;
  global: {
    bg_color: string;
    button_color: string;
    button_text_color: string;
    show_count: boolean;
    show_leaderboard: boolean;
  };
}) {
  const visible = sections.filter((s) => s.visible).sort((a, b) => a.order - b.order);
  return (
    <>
      {visible.map((section) => (
        <PreviewSection key={section.id} section={section} global={global} />
      ))}
    </>
  );
}

function PreviewSection({
  section,
  global,
}: {
  section: {
    type: "hero" | "features" | "how_it_works" | "faq" | "form" | "media_text";
    settings: Record<string, unknown>;
  };
  global: {
    button_color: string;
    button_text_color: string;
  };
}) {
  const s = section.settings as Record<string, string | string[]>;
  switch (section.type) {
    case "hero":
      return (
        <section className="text-center py-16">
          <h1 className="font-heading text-5xl tracking-tight text-foreground">
            {(s.title as string) || "Your title here"}
          </h1>
          {Boolean(s.subtitle) && (
            <p className="mt-4 text-lg text-muted-foreground">{s.subtitle as string}</p>
          )}
        </section>
      );
    case "features":
      return (
        <section className="py-12">
          <h2 className="font-heading text-3xl text-center text-foreground mb-8">
            {(s.title as string) || "Features"}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {((s.items as Array<{ icon?: string; title?: string; description?: string }>) ?? []).map(
              (item, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5">
                  <div className="text-2xl text-foreground/50 mb-2">{item.icon || "◆"}</div>
                  <h3 className="font-semibold text-foreground">{item.title || "Feature"}</h3>
                  {item.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  )}
                </div>
              ),
            )}
          </div>
        </section>
      );
    case "how_it_works":
      return (
        <section className="py-12">
          <h2 className="font-heading text-3xl text-center text-foreground mb-8">
            {(s.title as string) || "How it works"}
          </h2>
          <div className="space-y-4">
            {((s.steps as Array<{ icon?: string; title?: string; description?: string }>) ?? []).map(
              (step, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl border bg-card">
                  <div className="text-2xl text-foreground/50 font-heading shrink-0">
                    {step.icon || i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{step.title || `Step ${i + 1}`}</h3>
                    {step.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      );
    case "faq":
      return (
        <section className="py-12">
          <h2 className="font-heading text-3xl text-center text-foreground mb-8">
            {(s.title as string) || "FAQ"}
          </h2>
          <div className="space-y-3">
            {((s.questions as Array<{ question?: string; answer?: string }>) ?? []).map((q, i) => (
              <div key={i} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-foreground">{q.question || "Question?"}</h3>
                {q.answer && <p className="mt-2 text-sm text-muted-foreground">{q.answer}</p>}
              </div>
            ))}
          </div>
        </section>
      );
    case "form":
      return (
        <section className="py-12">
          <div
            className="rounded-xl p-8 text-center"
            style={{ backgroundColor: global.button_color, color: global.button_text_color }}
          >
            <h2 className="font-heading text-2xl mb-2">
              {(s.title as string) || "Join the waitlist"}
            </h2>
            {Boolean(s.subtitle) && <p className="opacity-80">{(s.subtitle as string) || ""}</p>}
            <p className="mt-4 text-sm opacity-70">
              (Form rendering happens via the public template; this is the custom builder preview.)
            </p>
          </div>
        </section>
      );
    case "media_text":
      return (
        <section className="py-12">
          <div className="grid gap-6 sm:grid-cols-2 items-center">
            {Boolean(s.image_url) && (
              <img
                src={s.image_url as string}
                alt=""
                className="rounded-xl border bg-muted w-full aspect-video object-cover"
              />
            )}
            <div>
              <h2 className="font-heading text-3xl text-foreground">
                {(s.title as string) || "Heading"}
              </h2>
              {Boolean(s.body) && <p className="mt-3 text-muted-foreground">{s.body as string}</p>}
            </div>
          </div>
        </section>
      );
    default:
      return null;
  }
}

function EmptyPreview({ projectName }: { projectName: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8 text-center">
      <div className="max-w-sm space-y-2">
        <p className="font-heading text-2xl text-foreground">{projectName}</p>
        <p className="text-sm text-muted-foreground">
          No template or sections configured yet. Pick a template or add sections
          in the editor to see the live preview.
        </p>
      </div>
    </div>
  );
}
