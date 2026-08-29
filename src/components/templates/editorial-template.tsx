"use client";

import { useWaitlistSubscribe } from "./use-waitlist-subscribe";
import type { EditorialTemplateData } from "@/lib/templates";

// The editorial template is a clean, type-led layout. Its accent is
// user-configurable (data.accent_color) but defaults to a deep ink color
// that pairs with the type, not the host app's bordeaux.
const ACCENT_DEFAULT = "#1a1a1a";

export function EditorialTemplate({
  publicKey,
  data,
  realCount,
}: {
  publicKey: string;
  data: EditorialTemplateData;
  realCount: number;
}) {
  const accent = data.accent_color && data.accent_color !== "#2563eb" ? data.accent_color : ACCENT_DEFAULT;
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

  if (step === "questions" && result?.post_signup) {
    return (
      <div className="w-full max-w-2xl mx-auto text-left">
        <EditorialCard>
          <p className="font-heading text-xl mb-4">{result.post_signup.title}</p>
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
              style={{ backgroundColor: accent }}
            >
              {savingAnswers ? "Saving..." : "Continue"}
            </button>
          </form>
        </EditorialCard>
      </div>
    );
  }

  if (step === "done" && result) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <EditorialCard>
          <div className="space-y-6 text-left">
            <h2 className="font-heading text-3xl text-neutral-900">You&apos;re on the list.</h2>
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
                  style={{ backgroundColor: accent }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </EditorialCard>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: editorial hero */}
        <div className="lg:col-span-7 text-left">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight text-neutral-900 leading-[1.05]">
            {data.title}{" "}
            {data.title_italic && (
              <span className="font-serif italic font-normal" style={{ color: accent }}>
                {data.title_italic}
              </span>
            )}
          </h1>

          {data.subtitle && <p className="mt-5 text-lg text-neutral-600 max-w-xl">{data.subtitle}</p>}

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

          <form onSubmit={handleSubmit} className="mt-8 max-w-lg">
            <div className="flex items-stretch overflow-hidden rounded-lg border-2 border-neutral-900 focus-within:ring-2 focus-within:ring-offset-2 transition" style={{ ["--tw-ring-color" as string]: accent }}>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ backgroundColor: accent }}
              >
                {loading ? "Joining..." : data.cta_label}
              </button>
            </div>
            <div ref={turnstileRef} className="cf-turnstile hidden" />
          </form>

          {data.show_social_proof && (
            <p className="mt-4 text-xs font-mono text-neutral-500">
              {realCount} people already joined
            </p>
          )}

          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-neutral-500">
            <span className="font-mono">{data.launch_timeline}</span>
            <span className="h-3 w-px bg-neutral-300" />
            <span>{data.version_status}</span>
            {data.social_x && (
              <a href={data.social_x} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition">
                X / Twitter
              </a>
            )}
            {data.social_linkedin && (
              <a href={data.social_linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition">
                LinkedIn
              </a>
            )}
          </div>
        </div>

        {/* Right: feature grid */}
        <div className="lg:col-span-5">
          <div className="grid grid-cols-2 gap-3">
            {data.features.map((feature, i) => (
              <div key={i} className="rounded-xl border border-neutral-900/10 bg-white p-4 min-h-[150px]">
                <div className="text-xl text-neutral-900">{feature.icon || "◆"}</div>
                <h3 className="mt-3 text-sm font-semibold text-neutral-900">{feature.title}</h3>
                {feature.description && (
                  <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{feature.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorialCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">{children}</div>
  );
}
