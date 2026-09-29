"use client";

import { useWaitlistSubscribe } from "./use-waitlist-subscribe";
import type { MonoTemplateData } from "@/lib/templates";
import type { ThankYouConfig } from "@/lib/thank-you-experiences";
import { Embajadores } from "@/components/thank-you/embajadores";

// Mono is precision brutalism: pure #FAFAFA, near-black text, a single
// electric accent, monospace for every label, and an oversized headline in
// the geometric sans (explicitly NOT the host app's serif `font-heading`,
// which the global h1-h4 rule would otherwise apply). No gradients, no
// shadows, no imagery, sharp corners — the type is the design.
//
// The accent is intentionally a module constant rather than a builder field:
// the template's whole identity is "exactly one accent".
const ACCENT = "#2540FF";

function formatCount(n: number): string {
  // Explicit locale so SSR and client always agree (no hydration mismatch).
  return new Intl.NumberFormat("en-US").format(n);
}

// An override is free text the owner controls ("8,000+", "12k"), so it is
// shown verbatim. The real count gets proper singular/plural, and zero never
// renders as negative social proof.
function socialLine(override: string, realCount: number): string {
  if (override) return `${override} people in line`;
  if (realCount === 1) return "1 person in line";
  if (realCount > 1) return `${formatCount(realCount)} people in line`;
  return "Be the first in line";
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full max-w-2xl px-2"
      style={{ "--mono-accent": ACCENT } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] tracking-[0.18em] text-black/60">
      {children}
    </p>
  );
}

const FIELD_CLASS =
  "w-full border border-black/15 bg-white px-3.5 py-2.5 text-[15px] text-[#0A0A0A] placeholder:text-black/30 outline-none transition-colors focus:border-[var(--mono-accent)]";

const BUTTON_CLASS =
  "shrink-0 bg-[var(--mono-accent)] px-6 py-3 font-mono text-[13px] tracking-wide text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--mono-accent)] focus-visible:outline-none disabled:opacity-50";

export function MonoTemplate({
  publicKey,
  data,
  realCount,
  preview = false,
  thankYou,
}: {
  publicKey: string;
  data: MonoTemplateData;
  realCount: number;
  preview?: boolean;
  thankYou: ThankYouConfig;
}) {
  const {
    email,
    setEmail,
    loading,
    error,
    result,
    step,
    answers,
    setAnswers,
    savingAnswers,
    copied,
    turnstileRef,
    handleSubmit,
    copyReferralLink,
    handleAnswersSubmit,
  } = useWaitlistSubscribe(publicKey, { preview });

  const countLine = socialLine(data.social_count_override.trim(), realCount);

  if (step === "questions" && result?.post_signup) {
    return (
      <Shell>
        <div className="mx-auto w-full max-w-md text-left">
          <Label>ONE LAST THING</Label>
          <h2 className="mt-3 font-sans text-2xl font-bold tracking-[-0.02em] text-[#0A0A0A]">
            {result.post_signup.title}
          </h2>

          {error && (
            <p role="alert" className="mt-4 font-mono text-[13px] text-[#C1121F]">
              {error}
            </p>
          )}

          <form onSubmit={handleAnswersSubmit} className="mt-7 space-y-6">
            {result.post_signup.questions.map((q, i) => (
              <div key={i} className="space-y-2">
                <label className="block font-mono text-[11px] tracking-[0.14em] text-black/55">
                  {q.label}
                  {q.required && <span className="ml-1 text-[var(--mono-accent)]">*</span>}
                </label>
                {q.type === "select" ? (
                  <select
                    value={answers[q.label] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                    required={q.required}
                    className={FIELD_CLASS}
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    {(q.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : q.type === "textarea" ? (
                  <textarea
                    value={answers[q.label] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                    required={q.required}
                    rows={3}
                    className={`${FIELD_CLASS} resize-y`}
                  />
                ) : (
                  <input
                    type="text"
                    value={answers[q.label] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                    required={q.required}
                    className={FIELD_CLASS}
                  />
                )}
              </div>
            ))}
            <button type="submit" disabled={savingAnswers} className={`${BUTTON_CLASS} w-full`}>
              {savingAnswers ? "Sending…" : "Continue"}
            </button>
          </form>
        </div>
      </Shell>
    );
  }

  // The project can override the post-signup screen: when it does, this
  // template's own done state is skipped entirely.
  if (step === "done" && result && thankYou.experience === "embajadores") {
    return (
      <Embajadores config={thankYou} result={result} copied={copied} onCopy={copyReferralLink} />
    );
  }

  if (step === "done" && result) {
    return (
      <Shell>
        <div className="text-center">
          <Label>YOU&apos;RE ON THE LIST</Label>
          <h2 className="mt-5 font-sans text-4xl font-extrabold tracking-[-0.04em] text-[#0A0A0A] sm:text-5xl">
            Position #{result.position ?? "—"}
          </h2>
          <p className="mt-4 font-mono text-[13px] leading-relaxed text-black/55">
            Move up by sharing your link — every signup pushes you forward.
          </p>

          <div className="mt-9 border border-black/15 bg-white p-4 text-left">
            <Label>YOUR REFERRAL LINK</Label>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                readOnly
                value={result.referral_link}
                aria-label="Your referral link"
                className="min-w-0 flex-1 border border-black/10 bg-[#FAFAFA] px-3.5 py-3 font-mono text-xs text-black/70 outline-none"
              />
              <button type="button" onClick={copyReferralLink} className={BUTTON_CLASS}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="text-center">
        <span className="inline-flex items-center gap-2 border border-black/10 px-3 py-1.5">
          <span className="size-1.5 shrink-0 bg-[var(--mono-accent)]" aria-hidden="true" />
          <span className="font-mono text-[11px] tracking-[0.18em] text-black/60">
            {data.badge_text}
          </span>
        </span>

        <h1 className="mt-7 font-sans text-[clamp(2.5rem,7.5vw,4.5rem)] font-extrabold leading-[0.95] tracking-[-0.045em] text-[#0A0A0A]">
          {data.title}
        </h1>

        {data.subtitle && (
          <p className="mx-auto mt-5 max-w-xl text-balance font-sans text-base leading-relaxed text-black/55 sm:text-lg">
            {data.subtitle}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-6 font-mono text-[13px] text-[#C1121F]">
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 flex w-full max-w-md flex-col gap-2.5 sm:flex-row"
        >
          <label htmlFor="mono-email" className="sr-only">
            Email address
          </label>
          <input
            id="mono-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`min-w-0 flex-1 ${FIELD_CLASS}`}
          />
          <button type="submit" disabled={loading} className={BUTTON_CLASS}>
            {loading ? "Sending…" : data.cta_label}
          </button>
          <div ref={turnstileRef} className="cf-turnstile hidden" />
        </form>

        {data.show_social_proof && (
          <p className="mt-8 font-mono text-xs tracking-[0.08em] text-black/60">
            {countLine}
          </p>
        )}
      </div>
    </Shell>
  );
}
