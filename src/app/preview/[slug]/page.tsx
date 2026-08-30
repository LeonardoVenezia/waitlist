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
      const sections = (pageSections.sections as unknown[]) ?? [];
      const rawGlobal = (pageSections.global as Draft["global"]) ?? {};
      const realCount = await getSubscriberCount(project.id);

      setDraft({
        templateId: (pageSections.template_id as TemplateId | null) ?? null,
        templateData: (pageSections.template_data as Record<string, unknown>) ?? {},
        global: {
          bg_color: rawGlobal.bg_color && rawGlobal.bg_color !== "#f9fafb" ? rawGlobal.bg_color : "#fbf8f3",
          button_color:
            rawGlobal.button_color && rawGlobal.button_color !== "#0ea5e9"
              ? rawGlobal.button_color
              : "oklch(0.48 0.19 70)", // keep in sync with --primary in globals.css,
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
              Pick a template from the editor sidebar to populate the preview.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
