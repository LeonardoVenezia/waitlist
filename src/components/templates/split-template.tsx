"use client";

import { useState } from "react";
import { useWaitlistSubscribe } from "./use-waitlist-subscribe";
import type { SplitTemplateData } from "@/lib/templates";

export function SplitTemplate({
  publicKey,
  data,
  realCount,
}: {
  publicKey: string;
  data: SplitTemplateData;
  realCount: number;
}) {
  const [activeTab, setActiveTab] = useState(0);
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
  } = useWaitlistSubscribe(publicKey);

  const socialCount = data.social_count_override || String(realCount);
  const active = data.tabs[activeTab];

  if (step === "questions" && result?.post_signup) {
    return (
      <div className="w-full max-w-xl mx-auto text-left">
        <SplitCard>
          <p className="font-heading text-lg mb-4">{result.post_signup.title}</p>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          <form onSubmit={handleAnswersSubmit} className="space-y-4">
            {result.post_signup.questions.map((q, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-sm text-foreground/80">
                  {q.label}
                  {q.required && <span className="text-destructive ml-0.5">*</span>}
                </label>
                {q.type === "select" ? (
                  <select
                    value={answers[q.label] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                    required={q.required}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="" disabled>Select...</option>
                    {(q.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : q.type === "textarea" ? (
                  <textarea
                    value={answers[q.label] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                    required={q.required}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                ) : (
                  <input
                    type="text"
                    value={answers[q.label] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                    required={q.required}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                )}
              </div>
            ))}
            <button
              type="submit"
              disabled={savingAnswers}
              className="w-full rounded-lg bg-primary text-primary-foreground font-medium px-4 py-2.5 transition disabled:opacity-50"
            >
              {savingAnswers ? "Saving..." : "Continue"}
            </button>
          </form>
        </SplitCard>
      </div>
    );
  }

  if (step === "done" && result) {
    return (
      <div className="w-full max-w-xl mx-auto">
        <SplitCard>
          <div className="space-y-6 text-left">
            <h2 className="font-heading text-2xl">You&apos;re in!</h2>
            <p className="text-muted-foreground">
              You&apos;re <span className="font-mono font-semibold text-foreground">#{result.position ?? "?"}</span> in
              line.
            </p>

            <div>
              <p className="text-sm text-foreground/80 mb-2">Share your referral link</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={result.referral_link}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground/80"
                />
                <button
                  onClick={copyReferralLink}
                  className="rounded-lg bg-primary text-primary-foreground font-medium px-3 text-sm transition"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </SplitCard>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left: sticky value column */}
        <div className="lg:sticky lg:top-8 lg:h-fit text-left py-6 lg:py-0">
          <h1 className="font-heading text-3xl sm:text-4xl tracking-tight leading-tight">
            {data.title}
          </h1>
          {data.subtitle && <p className="mt-4 text-muted-foreground">{data.subtitle}</p>}

          {data.benefits.length > 0 && (
            <ul className="mt-6 space-y-2.5">
              {data.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <span className="mt-1 text-foreground">→</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          <form onSubmit={handleSubmit} className="mt-8 max-w-md">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full rounded-lg bg-primary text-primary-foreground font-medium px-4 py-3 text-sm transition hover:bg-primary/80 disabled:opacity-50"
            >
              {loading ? "Joining..." : data.cta_label}
            </button>
            <div ref={turnstileRef} className="cf-turnstile hidden" />
          </form>

          {data.show_social_proof && (
            <p className="mt-4 text-xs text-muted-foreground">{socialCount} people already joined</p>
          )}

          {data.testimonials.length > 0 && (
            <div className="mt-10 space-y-3">
              {data.testimonials.map((t, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-3.5">
                  <p className="text-sm text-foreground/80">&ldquo;{t.quote}&rdquo;</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{t.author}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: interactive tabbed preview */}
        <div className="py-6 lg:py-0">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex gap-1 border-b border-border pb-3">
              {data.tabs.map((tab, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    activeTab === i
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {active && (
              <div key={activeTab} className="animate-in fade-in pt-5 min-h-[280px]">
                <div className="flex aspect-video items-center justify-center rounded-xl bg-muted">
                  <span className="font-heading text-7xl text-foreground/30">
                    {activeTab === 0 ? "L" : activeTab === 1 ? "A" : "R"}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{active.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{active.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SplitCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">{children}</div>
  );
}
