"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toggleFormStatus, deleteForm, updateForm } from "@/lib/testimonials/actions";
import { QuestionsEditor, type FormQuestion } from "./questions-editor";
import { FormPreviewFrame } from "@/components/testimonials/form-preview-frame";
import type { Database } from "@/lib/supabase/types";

type FormRow = Database["public"]["Tables"]["testimonial_forms"]["Row"];

const AVAILABLE_FIELDS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "company", label: "Company" },
  { key: "role", label: "Role" },
  { key: "message", label: "Message" },
  { key: "rating", label: "Rating" },
  { key: "photo", label: "Photo" },
  { key: "website", label: "Website" },
  { key: "logo", label: "Company logo" },
];

interface Design {
  thank_you_message?: string;
  reward_code?: string;
  ask_private_feedback?: boolean;
  ask_consent?: boolean;
}

function parseQuestions(raw: unknown): FormQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (q): q is FormQuestion =>
      typeof q === "object" &&
      q !== null &&
      typeof (q as FormQuestion).label === "string",
  );
}

export function FormEditor({ form, projectId }: { form: FormRow; projectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Fields
  const fields: string[] = Array.isArray(form.fields) ? (form.fields as string[]) : [];
  const [activeFields, setActiveFields] = useState<string[]>(fields);
  const [fieldsSaved, setFieldsSaved] = useState<string[]>(fields);
  const fieldsDirty = JSON.stringify([...activeFields].sort()) !== JSON.stringify([...fieldsSaved].sort());

  // Questions (lifted so the live preview reflects them while editing)
  const [questions, setQuestions] = useState<FormQuestion[]>(parseQuestions(form.questions));
  const [questionsSaved, setQuestionsSaved] = useState<FormQuestion[]>(questions);

  // Thank-you, reward code, extra steps & redirect
  const design = (form.design ?? {}) as Design;
  const [thankYou, setThankYou] = useState(design.thank_you_message ?? "");
  const [rewardCode, setRewardCode] = useState(design.reward_code ?? "");
  const [askPrivateFeedback, setAskPrivateFeedback] = useState(design.ask_private_feedback === true);
  const [askConsent, setAskConsent] = useState(design.ask_consent === true);
  const [redirectUrl, setRedirectUrl] = useState(form.redirect_url ?? "");
  const [closingSaved, setClosingSaved] = useState({
    thank: design.thank_you_message ?? "",
    reward: design.reward_code ?? "",
    privateFeedback: design.ask_private_feedback === true,
    consent: design.ask_consent === true,
    redirect: form.redirect_url ?? "",
  });
  const closingDirty =
    thankYou !== closingSaved.thank ||
    rewardCode !== closingSaved.reward ||
    askPrivateFeedback !== closingSaved.privateFeedback ||
    askConsent !== closingSaved.consent ||
    redirectUrl !== closingSaved.redirect;

  const [error, setError] = useState<string | null>(null);

  // Persist the in-progress draft to localStorage so /preview/forms/[formId]
  // can render what the user is currently trying (same pattern as the
  // page builder's preview-draft).
  useEffect(() => {
    try {
      localStorage.setItem(
        `preview-form-draft-${form.id}`,
        JSON.stringify({
          formId: form.id,
          projectId,
          slug: form.slug,
          name: form.name,
          description: form.description,
          fields: activeFields,
          questions,
          thankYouMessage: thankYou || null,
          wizard: {
            askPrivateFeedback,
            askConsent,
            rewardCode: rewardCode.trim() || null,
          },
        }),
      );
    } catch {
      // Storage unavailable — preview falls back to the saved form.
    }
  }, [form.id, form.slug, form.name, form.description, projectId, activeFields, questions, thankYou, rewardCode, askPrivateFeedback, askConsent]);

  function handleStatus(next: "draft" | "published" | "archived") {
    startTransition(async () => {
      await toggleFormStatus(form.id, next);
    });
  }

  async function saveFields(next: string[]) {
    setError(null);
    try {
      await updateForm(form.id, { fields: next });
      setFieldsSaved(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  }

  async function saveClosing() {
    setError(null);
    try {
      await updateForm(form.id, {
        redirect_url: redirectUrl.trim() || null,
        design: {
          ...design,
          thank_you_message: thankYou.trim() || undefined,
          reward_code: rewardCode.trim() || undefined,
          ask_private_feedback: askPrivateFeedback,
          ask_consent: askConsent,
        },
      });
      setClosingSaved({
        thank: thankYou.trim(),
        reward: rewardCode.trim(),
        privateFeedback: askPrivateFeedback,
        consent: askConsent,
        redirect: redirectUrl.trim(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  }

  function handleDelete() {
    if (!confirm("Delete this form? Collected testimonials are kept.")) return;
    startTransition(async () => {
      await deleteForm(form.id);
      router.push(`/dashboard/projects/${projectId}/testimonials/forms`);
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 items-start">
      <div className="space-y-5 min-w-0">
      <QuestionsEditor
        formId={form.id}
        questions={questions}
        savedQuestions={questionsSaved}
        onChange={setQuestions}
        onSaved={setQuestionsSaved}
      />

      {/* Fields */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold text-base mb-1">Fields</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Name and Message are always required. Each enabled field adds a step to the form:
          Rating, About you and About your company.
        </p>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_FIELDS.map((f) => {
            const active = activeFields.includes(f.key);
            const locked = f.key === "name" || f.key === "message";
            return (
              <button
                key={f.key}
                type="button"
                disabled={locked}
                onClick={() => {
                  const next = active
                    ? activeFields.filter((k) => k !== f.key)
                    : [...activeFields, f.key];
                  setActiveFields(next);
                }}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-colors select-none ${
                  active
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent"
                } ${locked ? "opacity-60 cursor-default" : "cursor-pointer"}`}
                title={locked ? "Always included" : undefined}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        {fieldsDirty && (
          <div className="flex items-center gap-3 mt-3">
            <Button size="sm" onClick={() => saveFields(activeFields)} disabled={pending}>
              Save fields
            </Button>
            <button
              type="button"
              onClick={() => setActiveFields(fieldsSaved)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Discard
            </button>
          </div>
        )}
      </div>

      {/* Moderation */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold text-base mb-4">Moderation</h3>
        <Select
          value={form.moderation}
          onChange={(e) => {
            const next = e.target.value as "manual" | "auto";
            startTransition(async () => {
              await updateForm(form.id, { moderation: next });
            });
          }}
          disabled={pending}
        >
          <option value="manual">Approve each testimonial manually</option>
          <option value="auto">Publish automatically</option>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">
          {form.moderation === "auto"
            ? "New submissions appear on your public page immediately."
            : "New submissions wait for your approval in the dashboard."}
        </p>
      </div>

      {/* Extra steps */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold text-base mb-1">Extra steps</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Optional steps in the middle of the form.
        </p>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm">Ask for private feedback</p>
              <p className="text-xs text-muted-foreground">
                A note that is never shared publicly.
              </p>
            </div>
            <Switch
              checked={askPrivateFeedback}
              onCheckedChange={setAskPrivateFeedback}
              disabled={pending}
            />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm">Ask where we can use it</p>
              <p className="text-xs text-muted-foreground">
                Public or private use consent. Private testimonials never show publicly.
              </p>
            </div>
            <Switch
              checked={askConsent}
              onCheckedChange={setAskConsent}
              disabled={pending}
            />
          </div>
        </div>
      </div>

      {/* Thank-you & redirect */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold text-base mb-1">After submitting</h3>
        <p className="text-xs text-muted-foreground mb-3">
          What people see when they finish. Redirect overrides the thank-you screen.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Thank-you message</label>
            <textarea
              value={thankYou}
              onChange={(e) => setThankYou(e.target.value)}
              rows={2}
              placeholder="Thanks! Your testimonial was received."
              className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary resize-y"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Reward code (optional)</label>
            <input
              value={rewardCode}
              onChange={(e) => setRewardCode(e.target.value)}
              placeholder="WELCOME10"
              spellCheck={false}
              className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Shown on the thank-you screen with a copy button.
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Redirect URL (optional)</label>
            <input
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              type="url"
              placeholder="https://tusitio.com/gracias"
              className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          {closingDirty && (
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={saveClosing} disabled={pending}>
                Save
              </Button>
              <button
                type="button"
                onClick={() => {
                  setThankYou(closingSaved.thank);
                  setRewardCode(closingSaved.reward);
                  setAskPrivateFeedback(closingSaved.privateFeedback);
                  setAskConsent(closingSaved.consent);
                  setRedirectUrl(closingSaved.redirect);
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Discard
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Status */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold text-base mb-4">Status</h3>
        <div className="flex gap-2">
          {(["draft", "published", "archived"] as const).map((s) => (
            <Button
              key={s}
              variant={form.status === s ? "default" : "outline"}
              onClick={() => handleStatus(s)}
              size="sm"
              disabled={pending}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
        <h3 className="font-semibold text-base mb-1 text-red-900">Danger zone</h3>
        <p className="text-xs text-red-700/70 mb-3">
          Deleting the form does not delete collected testimonials.
        </p>
        <Button variant="outline" size="sm" onClick={handleDelete} disabled={pending}>
          Delete form
        </Button>
      </div>
      </div>

      {/* Live preview — same pattern as the waitlist page builder */}
      <div className="lg:sticky lg:top-24 hidden lg:block">
        <FormPreviewFrame
          formId={form.id}
          projectId={projectId}
          fields={activeFields}
          questions={questions}
          thankYouMessage={thankYou || null}
          wizard={{
            askPrivateFeedback,
            askConsent,
            rewardCode: rewardCode.trim() || null,
          }}
          url={`/t/${form.slug}`}
          externalHref={`/preview/forms/${form.id}`}
        />
      </div>
    </div>
  );
}
