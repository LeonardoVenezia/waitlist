"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StarRating } from "@/components/ui/star-rating";
import { ImageUpload } from "@/components/shared/image-upload";
import { TURNSTILE_ENABLED } from "@/lib/turnstile";

declare global {
  interface Window {
    turnstile?: {
      render: (el: string | HTMLElement, opts: Record<string, unknown>) => string;
      execute: (el: string | HTMLElement, opts?: Record<string, unknown>) => void;
      reset: (el: string | HTMLElement) => void;
    };
    onTestimonialTurnstile?: (token: string) => void;
  }
}

interface WizardConfig {
  askPrivateFeedback: boolean;
  askConsent: boolean;
  rewardCode: string | null;
}

interface TestimonialFormProps {
  formId: string;
  projectId: string;
  fields: string[];
  questions: Record<string, unknown>[];
  redirectUrl: string | null;
  thankYouMessage?: string | null;
  wizard?: WizardConfig | null;
  inviteToken?: string | null;
  /** Dashboard preview mode: no Turnstile, no network — submit shows the thank-you state locally. */
  preview?: boolean;
}

type StepKey =
  | "rating"
  | "message"
  | "questions"
  | "private"
  | "consent"
  | "about"
  | "company"
  | "review";

const ABOUT_FIELDS = ["name", "email", "photo"];
const COMPANY_FIELDS = ["company", "role", "website", "logo"];

const STEP_COPY: Record<StepKey, { title: string; subtitle?: string }> = {
  rating: { title: "How would you rate us?", subtitle: "On a scale of 1 to 5." },
  message: { title: "Share your testimonial", subtitle: "A few sentences about your experience." },
  questions: { title: "A few more questions" },
  private: { title: "Any private feedback?", subtitle: "This won't be shared publicly." },
  consent: {
    title: "Where can we use your testimonial?",
    subtitle: "We'd like to use it in our marketing and sales. Where can we share it?",
  },
  about: { title: "About you", subtitle: "Share a little more about yourself." },
  company: { title: "About your company", subtitle: "Share a little more about your company." },
  review: { title: "Ready to send?", subtitle: "Happy with your testimonial? Send it over." },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClass =
  "mt-2 block w-full rounded-lg border border-input bg-transparent px-4 py-3.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const textareaClass = `${fieldClass} resize-y`;

export function TestimonialForm({
  formId,
  projectId,
  fields,
  questions,
  redirectUrl,
  thankYouMessage,
  wizard,
  inviteToken,
  preview,
}: TestimonialFormProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<string | null>(null);
  const turnstileEl = useRef<HTMLDivElement>(null);

  // Answers
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ""));
  const [privateFeedback, setPrivateFeedback] = useState("");
  const [consent, setConsent] = useState<"public" | "private" | "">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photoPath, setPhotoPath] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [website, setWebsite] = useState("");
  const [logoPath, setLogoPath] = useState("");

  const askPrivateFeedback = wizard?.askPrivateFeedback ?? false;
  const askConsent = wizard?.askConsent ?? false;
  const rewardCode = wizard?.rewardCode ?? null;

  const showAbout = ABOUT_FIELDS.some((f) => fields.includes(f));
  const showCompany = COMPANY_FIELDS.some((f) => fields.includes(f));

  const steps: StepKey[] = [];
  if (fields.includes("rating")) steps.push("rating");
  steps.push("message");
  if (questions.length > 0) steps.push("questions");
  if (askPrivateFeedback) steps.push("private");
  if (askConsent) steps.push("consent");
  if (showAbout) steps.push("about");
  if (showCompany) steps.push("company");
  steps.push("review");

  const current = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  useEffect(() => {
    if (preview || !TURNSTILE_ENABLED) return;

    const scriptId = "cf-turnstile-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const interval = setInterval(() => {
      if (window.turnstile && turnstileEl.current && !turnstileRef.current) {
        window.onTestimonialTurnstile = (token: string) => {
          setTurnstileToken(token);
        };
        turnstileRef.current = window.turnstile.render(turnstileEl.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
          callback: "onTestimonialTurnstile",
        });
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  /** Turnstile tokens are single-use, so refresh after consuming one on upload. */
  function refreshTurnstile() {
    if (!TURNSTILE_ENABLED) return;
    setTurnstileToken(null);
    if (turnstileEl.current) window.turnstile?.reset(turnstileEl.current);
  }

  /** Marks the offending control and returns the message for the inline error. */
  function fail(field: string, message: string): string {
    setInvalidField(field);
    return message;
  }

  function validateStep(): string | null {
    if (current === "rating" && rating === 0) {
      return fail("rating", "Pick a rating to continue.");
    }
    if (current === "message" && !message.trim()) {
      return fail("message", "Please write your testimonial.");
    }
    if (current === "questions") {
      for (let i = 0; i < questions.length; i++) {
        if (questions[i]?.required && !answers[i]?.trim()) {
          const label = (questions[i]?.label as string) ?? `Question ${i + 1}`;
          return fail(`question_${i}`, `Please answer "${label}".`);
        }
      }
    }
    if (current === "consent" && !consent) {
      return fail("consent", "Please choose an option.");
    }
    if (current === "about") {
      if (fields.includes("name") && !name.trim()) {
        return fail("name", "Please enter your name.");
      }
      if (email.trim() && !EMAIL_RE.test(email.trim())) {
        return fail("email", "Please enter a valid email address.");
      }
    }
    return null;
  }

  function goNext() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setInvalidField(null);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function goBack() {
    setError(null);
    setInvalidField(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  /** Enter advances the wizard; textareas keep their newline. */
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter" || isLast) return;
    const target = e.target as HTMLElement;
    if (target.tagName !== "INPUT" || (target as HTMLInputElement).type === "file") return;
    e.preventDefault();
    goNext();
  }

  async function handleSubmit() {
    if (TURNSTILE_ENABLED && !preview && !turnstileToken) {
      setError("Please wait a moment for verification, then try again.");
      return;
    }

    // Preview mode: show the thank-you state without hitting the API.
    if (preview) {
      setSubmitted(true);
      return;
    }

    setLoading(true);
    setError(null);

    const body: Record<string, unknown> = {
      form_id: formId,
      project_id: projectId,
      name,
      message,
      rating,
      turnstile_token: turnstileToken,
    };

    if (inviteToken) body.invite_token = inviteToken;
    if (fields.includes("email") && email.trim()) body.email = email.trim();
    if (fields.includes("company") && company.trim()) body.company = company.trim();
    if (fields.includes("role") && role.trim()) body.role = role.trim();
    if (fields.includes("website") && website.trim()) body.website = website.trim();
    if (fields.includes("photo") && photoPath) body.avatar_url = photoPath;
    if (fields.includes("logo") && logoPath) body.company_logo_url = logoPath;
    if (askPrivateFeedback && privateFeedback.trim()) body.private_feedback = privateFeedback.trim();
    if (askConsent && consent) body.consent = consent;
    questions.forEach((_, i) => {
      const val = answers[i]?.trim();
      if (val) body[`question_${i}`] = val;
    });

    try {
      const res = await fetch("/api/testimonials/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setError(err?.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        refreshTurnstile();
        return;
      }

      setSubmitted(true);

      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 2000);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
      refreshTurnstile();
    }
  }

  function copyRewardCode() {
    if (!rewardCode) return;
    navigator.clipboard.writeText(rewardCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (submitted) {
    const firstName = name.trim().split(" ")[0];
    return (
      <div className="animate-rise py-6 text-center">
        <h3 className="font-heading text-3xl font-normal tracking-tight sm:text-4xl">
          Thank you{firstName ? `, ${firstName}` : ""}.
        </h3>
        <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
          {thankYouMessage || "It means a lot that you took the time."}
        </p>

        {rewardCode && (
          <div className="mx-auto mt-10 max-w-sm rounded-xl border bg-muted/40 p-5 text-left">
            <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
              Your reward
            </p>
            <div className="my-3 border-t border-dashed border-border" />
            <div className="flex items-center justify-center gap-4">
              <span className="font-mono text-lg tracking-[0.14em]">{rewardCode}</span>
              <button
                type="button"
                onClick={copyRewardCode}
                aria-label="Copy reward code"
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {copied ? (
                  <span className="text-xs font-medium text-primary">Copied</span>
                ) : (
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {redirectUrl && <p className="mt-6 text-sm text-muted-foreground">Redirecting…</p>}
      </div>
    );
  }

  return (
    <div className="space-y-8" onKeyDown={handleKeyDown}>
      {/* Progress */}
      <div>
        <div className="mb-2 text-xs tracking-wide text-muted-foreground">
          Step {stepIndex + 1} of {steps.length}
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="min-h-[280px]">
        <h2 className="font-heading text-2xl font-normal tracking-tight sm:text-3xl">
          {STEP_COPY[current].title}
        </h2>
        {STEP_COPY[current].subtitle && (
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            {STEP_COPY[current].subtitle}
          </p>
        )}

        <div className="mt-8">
          {current === "rating" && (
            <div className="flex justify-center py-8">
              <StarRating value={rating} onChange={setRating} size="xl" />
            </div>
          )}

          {current === "message" && (
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Write your testimonial..."
              aria-invalid={invalidField === "message"}
              className={textareaClass}
            />
          )}

          {current === "questions" &&
            questions.map((q, i) => (
              <div key={i} className="mb-6 last:mb-0">
                <label className="text-base font-medium">
                  {(q.label as string) ?? `Question ${i + 1}`}
                  {q.required ? " *" : ""}
                </label>
                {q.type === "textarea" ? (
                  <textarea
                    value={answers[i] ?? ""}
                    onChange={(e) => setAnswers((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
                    rows={4}
                    aria-invalid={invalidField === `question_${i}`}
                    className={textareaClass}
                  />
                ) : q.type === "select" && Array.isArray(q.options) ? (
                  <Select
                    value={answers[i] ?? ""}
                    onChange={(e) => setAnswers((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
                    aria-invalid={invalidField === `question_${i}`}
                    className="mt-2 h-12 px-4 text-base"
                  >
                    <option value="">Select...</option>
                    {(q.options as string[]).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </Select>
                ) : (
                  <input
                    value={answers[i] ?? ""}
                    onChange={(e) => setAnswers((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
                    aria-invalid={invalidField === `question_${i}`}
                    className={fieldClass}
                  />
                )}
              </div>
            ))}

          {current === "private" && (
            <textarea
              value={privateFeedback}
              onChange={(e) => setPrivateFeedback(e.target.value)}
              rows={6}
              placeholder="Write your feedback..."
              className={textareaClass}
            />
          )}

          {current === "consent" && (
            <div className="flex flex-col gap-3">
              {([
                { value: "public", label: "You can use my testimonial publicly in your marketing and sales." },
                { value: "private", label: "You can only use my testimonial privately in your marketing and sales." },
              ] as const).map((opt) => {
                const active = consent === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setConsent(opt.value)}
                    className={`flex items-start gap-3 rounded-lg border p-5 text-left text-base transition-colors ${
                      active ? "border-primary bg-primary/5" : "hover:bg-accent"
                    }`}
                  >
                    <span
                      className={`mt-1 size-4 shrink-0 rounded-full border flex items-center justify-center ${
                        active ? "border-primary" : "border-muted-foreground/40"
                      }`}
                    >
                      {active && <span className="size-2 rounded-full bg-primary" />}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {current === "about" && (
            <div className="space-y-6">
              {fields.includes("name") && (
                <div>
                  <label className="text-base font-medium">Your name *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    aria-invalid={invalidField === "name"}
                    className={fieldClass}
                  />
                </div>
              )}
              {fields.includes("email") && (
                <div>
                  <label className="text-base font-medium">Your email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    aria-invalid={invalidField === "email"}
                    className={fieldClass}
                  />
                </div>
              )}
              {fields.includes("photo") && (
                <div>
                  <label className="text-base font-medium">Your photo</label>
                  <div className="mt-2">
                    <ImageUpload
                      value={photoPath}
                      onChange={setPhotoPath}
                      onRemove={() => setPhotoPath("")}
                      endpoint="/api/testimonials/upload-url"
                      extraBody={{ form_id: formId, turnstile_token: turnstileToken ?? "" }}
                      onUploaded={refreshTurnstile}
                      variant="avatar"
                      preview={preview}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {current === "company" && (
            <div className="space-y-6">
              {fields.includes("role") && (
                <div>
                  <label className="text-base font-medium">Job title</label>
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    autoComplete="organization-title"
                    className={fieldClass}
                  />
                </div>
              )}
              {fields.includes("company") && (
                <div>
                  <label className="text-base font-medium">Company</label>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    autoComplete="organization"
                    className={fieldClass}
                  />
                </div>
              )}
              {fields.includes("website") && (
                <div>
                  <label className="text-base font-medium">Website</label>
                  <input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    inputMode="url"
                    autoComplete="url"
                    className={fieldClass}
                  />
                </div>
              )}
              {fields.includes("logo") && (
                <div>
                  <label className="text-base font-medium">Company logo</label>
                  <div className="mt-2">
                    <ImageUpload
                      value={logoPath}
                      onChange={setLogoPath}
                      onRemove={() => setLogoPath("")}
                      endpoint="/api/testimonials/upload-url"
                      extraBody={{ form_id: formId, turnstile_token: turnstileToken ?? "" }}
                      onUploaded={refreshTurnstile}
                      variant="avatar"
                      preview={preview}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {current === "review" && (
            <dl className="space-y-3">
              {fields.includes("rating") && <SummaryRow label="Rating" value={`${rating} / 5`} />}
              <SummaryRow label="Testimonial" value={message} />
              {questions.map((q, i) =>
                answers[i]?.trim() ? (
                  <SummaryRow key={i} label={(q.label as string) ?? `Question ${i + 1}`} value={answers[i]} />
                ) : null,
              )}
              {askPrivateFeedback && privateFeedback.trim() && (
                <SummaryRow label="Private feedback" value={privateFeedback} />
              )}
              {askConsent && consent && (
                <SummaryRow
                  label="Usage"
                  value={consent === "public" ? "Public use allowed" : "Private use only"}
                />
              )}
              {(name || email) && <SummaryRow label="About you" value={[name, email].filter(Boolean).join(" · ")} />}
              {(company || role || website) && (
                <SummaryRow label="Company" value={[role, company, website].filter(Boolean).join(" · ")} />
              )}
            </dl>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-base text-destructive">
          {error}
        </p>
      )}

      {!preview && TURNSTILE_ENABLED && <div ref={turnstileEl} className="flex justify-center" />}

      <div className="flex flex-col items-center gap-4">
        {isLast ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || (TURNSTILE_ENABLED && !preview && !turnstileToken)}
            className="h-12 w-full text-base"
          >
            {loading ? "Sending…" : "Send testimonial"}
          </Button>
        ) : (
          <Button type="button" onClick={goNext} className="h-12 w-full text-base">
            Continue
          </Button>
        )}
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={goBack}
            disabled={loading}
            className="text-base text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-base break-words whitespace-pre-line">{value}</dd>
    </div>
  );
}
