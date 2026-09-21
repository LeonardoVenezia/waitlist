"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TestimonialForm } from "@/app/t/[formSlug]/testimonial-form";

type FormQuestion = {
  label: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  required: boolean;
};

interface FormDraft {
  formId: string;
  projectId: string;
  slug: string;
  name: string;
  description: string | null;
  fields: string[];
  questions: FormQuestion[];
  thankYouMessage: string | null;
  wizard: {
    askPrivateFeedback: boolean;
    askConsent: boolean;
    rewardCode: string | null;
  };
}

// Full-page preview of a testimonial form. Renders whatever the user is
// currently editing in the form editor, with `preview` so submissions are
// simulated locally instead of being recorded.
//
// The form editor writes the in-progress draft to localStorage under
// `preview-form-draft-{formId}` on every change. The fullscreen arrow in the
// dashboard preview targets this route; if no draft is present (direct link
// or fresh tab), it falls back to the saved form from the database.
export default function FormPreviewPage() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  const [draft, setDraft] = useState<FormDraft | null | "loading">("loading");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const draftKey = `preview-form-draft-${formId}`;
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(draftKey) : null;

      if (raw) {
        try {
          const parsed = JSON.parse(raw) as FormDraft;
          if (!cancelled) setDraft(parsed);
          return;
        } catch {
          // Fall through to DB fallback.
        }
      }

      // Fallback: saved form from the DB (owners can read any status via RLS).
      const supabase = createClient();
      const { data: form } = await supabase
        .from("testimonial_forms")
        .select("*")
        .eq("id", formId)
        .maybeSingle();

      if (cancelled) return;
      if (!form) {
        setMissing(true);
        return;
      }

      const design = (form.design ?? {}) as {
        thank_you_message?: string;
        ask_private_feedback?: boolean;
        ask_consent?: boolean;
        reward_code?: string;
      };
      const rawFields = form.fields as unknown;
      setDraft({
        formId: form.id,
        projectId: form.project_id,
        slug: form.slug,
        name: form.name,
        description: form.description,
        fields: Array.isArray(rawFields) ? (rawFields as string[]) : [],
        questions: Array.isArray(form.questions) ? (form.questions as FormQuestion[]) : [],
        thankYouMessage: design.thank_you_message ?? null,
        wizard: {
          askPrivateFeedback: design.ask_private_feedback === true,
          askConsent: design.ask_consent === true,
          rewardCode: design.reward_code?.trim() || null,
        },
      });
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [formId]);

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
          href={`/dashboard/projects/${draft.projectId}/testimonials/forms/${draft.formId}`}
          className="rounded-md border border-amber-900/20 bg-white px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors"
        >
          Back to editor
        </Link>
      </div>

      <div className="flex min-h-screen flex-col bg-background">
        <header className="px-6 pt-12 text-center sm:pt-16">
          <h1 className="font-heading text-3xl font-normal tracking-tight sm:text-4xl">
            {draft.name}
          </h1>
          {draft.description && (
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
              {draft.description}
            </p>
          )}
        </header>

        <main className="flex flex-1 items-start justify-center px-6 py-10 sm:py-14">
          <div className="w-full max-w-xl">
            <TestimonialForm
              formId={draft.formId}
              projectId={draft.projectId}
              fields={draft.fields}
              questions={draft.questions}
              redirectUrl={null}
              thankYouMessage={draft.thankYouMessage}
              wizard={draft.wizard ?? null}
              preview
            />
          </div>
        </main>

        <footer className="px-6 pb-10 text-center text-xs text-muted-foreground">
          Powered by{" "}
          <Link href="/" className="underline transition-colors hover:text-foreground">
            [PACK]
          </Link>
        </footer>
      </div>
    </div>
  );
}
