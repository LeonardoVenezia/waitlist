"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TemplateRenderer } from "@/components/templates/template-renderer";
import { getSubscriberCount } from "@/lib/api/position";

type TemplateId = "neon" | "carbon" | "pastel" | "editorial" | "split";

interface Draft {
  templateId: TemplateId | null;
  templateData: Record<string, unknown>;
  sections: Section[];
  global: {
    bg_color: string;
    button_color: string;
    button_text_color: string;
    show_count: boolean;
    show_leaderboard: boolean;
    page_enabled: boolean;
  };
  projectId: string;
  publicKey: string;
  realCount: number;
}

interface Section {
  id: string;
  type: "hero" | "features" | "how_it_works" | "faq" | "form" | "media_text";
  visible: boolean;
  order: number;
  settings: Record<string, unknown>;
}

// Full-page preview of a project's waitlist. Renders whatever the user is
// currently editing in the page builder, with `preview=true` so the
// subscribe hook returns a mock result instead of inserting.
//
// The page builder writes the in-progress draft to localStorage under
// `preview-draft-{slug}` whenever the user picks a template or edits the
// page. The fullscreen icon link in the page builder targets this route
// and the route reads that draft and renders it. If no draft is present
// (direct link, or a fresh tab after a refresh), the route falls back to
// the saved design from the database.
export default function PreviewPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [draft, setDraft] = useState<Draft | null | "loading">("loading");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const draftKey = `preview-draft-${slug}`;
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(draftKey) : null;

      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Draft;
          if (!cancelled) setDraft(parsed);
          return;
        } catch {
          // Fall through to DB fallback.
        }
      }

      // Fallback: load the saved design from the database.
      const supabase = createClient();
      const { data: project, error } = await supabase
        .from("projects")
        .select("id, public_key, status, settings, accounts!inner(owner_id)")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();

      if (cancelled) return;
      if (error || !project) {
        setMissing(true);
        return;
      }

      const settings = (project.settings as Record<string, unknown>) ?? {};
      const pageSections = (settings.page_sections as Record<string, unknown>) ?? {};
      const rawGlobal = (pageSections.global as Draft["global"]) ?? {};
      const realCount = await getSubscriberCount(project.id);

      setDraft({
        templateId: (pageSections.template_id as TemplateId | null) ?? null,
        templateData: (pageSections.template_data as Record<string, unknown>) ?? {},
        sections: (pageSections.sections as Section[]) ?? [],
        global: {
          bg_color: rawGlobal.bg_color && rawGlobal.bg_color !== "#f9fafb" ? rawGlobal.bg_color : "#fbf8f3",
          button_color:
            rawGlobal.button_color && rawGlobal.button_color !== "#0ea5e9"
              ? rawGlobal.button_color
              : "#7a3325",
          button_text_color: rawGlobal.button_text_color ?? "#fffaf3",
          show_count: rawGlobal.show_count ?? true,
          show_leaderboard: rawGlobal.show_leaderboard ?? true,
          page_enabled: rawGlobal.page_enabled ?? true,
        },
        projectId: project.id,
        publicKey: project.public_key,
        realCount,
      });
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (missing) notFound();

  if (draft === "loading" || draft === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading preview…
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b bg-amber-50 px-4 py-2 text-sm text-amber-900">
        <span>
          <strong>Preview</strong> — submissions here are not recorded. This page is
          only visible to you.
        </span>
        <Link
          href={`/dashboard/projects/${draft.projectId}/page-builder`}
          className="rounded-md border border-amber-900/20 bg-white px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors"
        >
          Back to editor
        </Link>
      </div>

      {draft.templateId ? (
        <TemplateRenderer
          templateId={draft.templateId}
          templateData={draft.templateData}
          publicKey={draft.publicKey}
          realCount={draft.realCount}
          preview
        />
      ) : draft.sections.length > 0 ? (
        <CustomBuilderPreview sections={draft.sections} global={draft.global} />
      ) : (
        <div
          className="min-h-screen"
          style={{ backgroundColor: draft.global.bg_color }}
        >
          <div className="mx-auto max-w-2xl px-6 py-24 text-center">
            <h1 className="font-heading text-5xl text-foreground">
              Custom builder preview
            </h1>
            <p className="mt-4 text-muted-foreground">
              Add sections from the editor sidebar to populate the preview.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomBuilderPreview({
  sections,
  global,
}: {
  sections: Section[];
  global: Draft["global"];
}) {
  const visible = sections
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);
  if (visible.length === 0) return null;
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: global.bg_color }}
    >
      <div className="mx-auto" style={{ maxWidth: 720, padding: "40px 24px" }}>
        {visible.map((section) => (
          <SectionBlock key={section.id} section={section} global={global} />
        ))}
      </div>
    </div>
  );
}

function SectionBlock({
  section,
  global,
}: {
  section: Section;
  global: Draft["global"];
}) {
  const s = section.settings as Record<string, unknown>;

  switch (section.type) {
    case "hero": {
      const title = (s.title as string) || "";
      const subtitle = (s.subtitle as string) || "";
      return (
        <section className="text-center py-16">
          {title ? (
            <h1 className="font-heading text-5xl tracking-tight text-foreground">
              {title}
            </h1>
          ) : (
            <h1 className="font-heading text-3xl tracking-tight text-muted-foreground/50 italic">
              Your hero title
            </h1>
          )}
          {subtitle ? (
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              {subtitle}
            </p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground/50 italic">
              Your hero subtitle
            </p>
          )}
          {Boolean(s.bg_image) && (
            <div className="mt-8 mx-auto max-w-3xl aspect-video rounded-xl bg-muted bg-cover bg-center border" style={{ backgroundImage: `url(${s.bg_image})` }} />
          )}
        </section>
      );
    }
    case "features":
      return (
        <section className="py-10">
          {Boolean(s.title) && (
            <h2 className="font-heading text-3xl text-center text-foreground mb-8">
              {s.title as string}
            </h2>
          )}
          <div className="grid gap-6 sm:grid-cols-3">
            {((s.items as Array<{ icon?: string; title?: string; description?: string }>) ?? []).map(
              (item, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5 text-center">
                  {Boolean(item.icon) && (
                    <div className="text-2xl text-foreground/50 mb-2">{item.icon}</div>
                  )}
                  <h3 className="font-semibold text-foreground">{item.title || ""}</h3>
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
        <section className="py-10">
          {Boolean(s.title) && (
            <h2 className="font-heading text-3xl text-center text-foreground mb-8">
              {s.title as string}
            </h2>
          )}
          <div className="space-y-4">
            {((s.steps as Array<{ icon?: string; title?: string; description?: string }>) ?? []).map(
              (step, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl border bg-card">
                  <div className="text-2xl text-foreground/50 font-heading shrink-0">
                    {step.icon || i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{step.title || ""}</h3>
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
        <section className="py-10">
          {Boolean(s.title) && (
            <h2 className="font-heading text-3xl text-center text-foreground mb-8">
              {s.title as string}
            </h2>
          )}
          <div className="space-y-3">
            {((s.questions as Array<{ question?: string; answer?: string }>) ?? []).map((q, i) => (
              <div key={i} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold text-foreground">{q.question || ""}</h3>
                {q.answer && <p className="mt-2 text-sm text-muted-foreground">{q.answer}</p>}
              </div>
            ))}
          </div>
        </section>
      );
    case "form": {
      // Render a static email + submit pill that looks like the real
      // PublicWaitlistForm. Turnstile is intentionally not mounted (no
      // third-party widget in preview); the button has no submit handler
      // and shows a "Preview" note on click is fine to skip — the user
      // gets the visual.
      const buttonColor = global.button_color;
      const buttonText = global.button_text_color;
      const label = (s.cta_label as string) || (s.title as string) || "Join the waitlist";
      const title = (s.title as string) || "";
      const subtitle = (s.subtitle as string) || "";
      return (
        <section className="py-12 text-center">
          {title && (
            <h2 className="font-heading text-3xl text-foreground mb-3">{title}</h2>
          )}
          {subtitle && (
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">{subtitle}</p>
          )}
          <div
            className="mx-auto flex items-center rounded-full p-1.5 max-w-md"
            style={{ backgroundColor: buttonColor, color: buttonText }}
          >
            <span
              className="flex-1 bg-transparent px-4 py-1.5 text-sm text-left opacity-80"
            >
              you@example.com
            </span>
            <span
              className="rounded-full font-medium px-5 py-1.5 text-sm"
              style={{ backgroundColor: buttonText, color: buttonColor }}
            >
              {label}
            </span>
          </div>
        </section>
      );
    }
    case "media_text":
      return (
        <section className="py-10">
          <div className="grid gap-6 sm:grid-cols-2 items-center">
            {Boolean(s.image_url) && (
              <img
                src={s.image_url as string}
                alt=""
                className="rounded-xl border bg-muted w-full aspect-video object-cover"
              />
            )}
            <div>
              {Boolean(s.title) && (
                <h2 className="font-heading text-3xl text-foreground">
                  {s.title as string}
                </h2>
              )}
              {Boolean(s.body) && (
                <p className="mt-3 text-muted-foreground">{s.body as string}</p>
              )}
            </div>
          </div>
        </section>
      );
    default:
      return null;
  }
}
