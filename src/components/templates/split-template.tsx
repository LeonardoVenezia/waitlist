"use client";

import { useState } from "react";
import { useWaitlistSubscribe } from "./use-waitlist-subscribe";
import type { SplitTemplateData } from "@/lib/templates";

// The split template is a sticky two-column with interactive tabs on the
// right. Its identity is a clean cream background and a deep ink CTA —
// intentionally not the host app's bordeaux, which would feel out of
// place in a layout this light and editorial.
const ACCENT = "#111111";

export function SplitTemplate({
  publicKey,
  data,
  realCount,
  preview = false,
}: {
  publicKey: string;
  data: SplitTemplateData;
  realCount: number;
  preview?: boolean;
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
  } = useWaitlistSubscribe(publicKey, { preview });

  const socialCount = data.social_count_override || String(realCount);
  const active = data.tabs[activeTab];

  if (step === "questions" && result?.post_signup) {
    return (
      <div className="w-full max-w-xl mx-auto text-left">
        <SplitCard>
          <p className="font-heading text-lg mb-4">{result.post_signup.title}</p>
          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
          <form onSubmit={handleAnswersSubmit} className="space-y-4">
            {result.post_signup.questions.map((q, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-sm text-neutral-700">
                  {q.label}
                  {q.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                {q.type === "select" ? (
                  <select
                    value={answers[q.label] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                    required={q.required}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
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
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                  />
                ) : (
                  <input
                    type="text"
                    value={answers[q.label] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                    required={q.required}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                  />
                )}
              </div>
            ))}
            <button
              type="submit"
              disabled={savingAnswers}
              className="w-full rounded-lg font-semibold px-4 py-2.5 text-white transition disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
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
            <h2 className="font-heading text-2xl text-neutral-900">You&apos;re in!</h2>
            <p className="text-neutral-600">
              You&apos;re <span className="font-mono font-semibold text-neutral-900">#{result.position ?? "?"}</span> in
              line.
            </p>

            <div>
              <p className="text-sm text-neutral-700 mb-2">Share your referral link</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={result.referral_link}
                  className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-mono text-neutral-700"
                />
                <button
                  onClick={copyReferralLink}
                  className="rounded-lg font-semibold px-3 text-sm text-white transition"
                  style={{ backgroundColor: ACCENT }}
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
          <h1 className="font-heading text-3xl sm:text-4xl tracking-tight leading-tight text-neutral-900">
            {data.title}
          </h1>
          {data.subtitle && <p className="mt-4 text-neutral-600">{data.subtitle}</p>}

          {data.benefits.length > 0 && (
            <ul className="mt-6 space-y-2.5">
              {data.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700">
                  <span className="mt-1 text-neutral-900">→</span>
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
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full rounded-lg font-semibold px-4 py-3 text-sm text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
            >
              {loading ? "Joining..." : data.cta_label}
            </button>
            <div ref={turnstileRef} className="cf-turnstile hidden" />
          </form>

          {data.show_social_proof && (
            <p className="mt-4 text-xs text-neutral-500">{socialCount} people already joined</p>
          )}
        </div>

        {/* Right: interactive tabbed preview */}
        <div className="py-6 lg:py-0">
          <div className="h-full rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col">
            <div className="flex gap-1 border-b border-neutral-100 pb-3">
              {data.tabs.map((tab, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    activeTab === i
                      ? "text-white"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                  style={activeTab === i ? { backgroundColor: ACCENT } : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {active && (
              <div key={activeTab} className="animate-in fade-in pt-5 flex-1">
                <div className="flex aspect-video items-center justify-center rounded-xl bg-neutral-100">
                  <span className="font-heading text-7xl text-neutral-400/60">
                    {activeTab === 0 ? "L" : activeTab === 1 ? "A" : "R"}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">{active.title}</h3>
                <p className="mt-1.5 text-sm text-neutral-600">{active.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {data.testimonials.length > 0 && (
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.testimonials.map((t, i) => (
            <div key={i} className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-sm text-neutral-700">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-2 text-xs text-neutral-400">{t.author}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SplitCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">{children}</div>
  );
}
