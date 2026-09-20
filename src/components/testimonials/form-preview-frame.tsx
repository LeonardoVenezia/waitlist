import { TestimonialForm } from "@/app/t/[formSlug]/testimonial-form";

interface FormPreviewFrameProps {
  formId: string;
  projectId: string;
  fields: string[];
  questions: Record<string, unknown>[];
  thankYouMessage?: string | null;
  wizard?: {
    askPrivateFeedback: boolean;
    askConsent: boolean;
    rewardCode: string | null;
  } | null;
  /** URL shown in the fake browser bar. */
  url: string;
  /** Where the external-link icon points (the real public form). */
  externalHref?: string;
  /** card: fixed short height for list cards. editor: tall live panel. */
  variant?: "card" | "editor";
}

/**
 * Browser-frame preview of the real testimonial form, following the waitlist
 * page-builder preview pattern: chrome bar with dots + URL, live form inside.
 * The form renders in preview mode — no Turnstile, no network requests.
 */
export function FormPreviewFrame({
  formId,
  projectId,
  fields,
  questions,
  thankYouMessage,
  wizard,
  url,
  externalHref,
  variant = "card",
}: FormPreviewFrameProps) {
  return (
    <div className="flex flex-col overflow-hidden bg-card border rounded-2xl shadow-sm h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b">
        <span className="size-2.5 rounded-full bg-red-400/70 shrink-0" />
        <span className="size-2.5 rounded-full bg-yellow-400/70 shrink-0" />
        <span className="size-2.5 rounded-full bg-green-400/70 mr-1 shrink-0" />
        <span className="text-[11px] font-mono text-muted-foreground truncate">{url}</span>
        {externalHref && (
          <a
            href={externalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center size-6 rounded-md hover:bg-muted transition-colors shrink-0 ml-auto"
            title="Open public form"
          >
            <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      <div
        className={
          variant === "editor"
            ? "flex-1 min-h-[420px] max-h-[640px] overflow-y-auto bg-background px-6 py-6"
            : "min-h-0 overflow-y-auto bg-background px-4 py-4 h-[320px]"
        }
      >
        <div className={variant === "editor" ? "max-w-sm mx-auto" : "mx-auto"}>
          <TestimonialForm
            formId={formId}
            projectId={projectId}
            fields={fields}
            questions={questions}
            redirectUrl={null}
            thankYouMessage={thankYouMessage}
            wizard={wizard ?? null}
            preview
          />
        </div>
      </div>
    </div>
  );
}
