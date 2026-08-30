"use client";

import { useWaitlistSubscribe } from "./use-waitlist-subscribe";
import type { PastelTemplateData } from "@/lib/templates";

// The pastel template is a soft, animated gradient with a glass card
// and floating tags. The CTA, focus rings, and tag colors are all in
// its own purple/lilac family — explicitly NOT the host app's bordeaux.

const ACCENT = "#8b5cf6";
const ACCENT_LIGHT = "#a78bfa";
const TAG_COLORS = [
  { bg: "rgba(244,114,182,0.25)", fg: "#9d174d" }, // pink
  { bg: "rgba(168,85,247,0.25)", fg: "#6b21a8" }, // purple
  { bg: "rgba(139,92,246,0.25)", fg: "#5b21b6" }, // violet
  { bg: "rgba(96,165,250,0.25)", fg: "#1e40af" }, // blue
  { bg: "rgba(244,114,182,0.25)", fg: "#9d174d" }, // pink
];

export function PastelTemplate({
  publicKey,
  data,
  realCount,
  embedded = false,
  preview = false,
}: {
  publicKey: string;
  data: PastelTemplateData;
  realCount: number;
  embedded?: boolean;
  preview?: boolean;
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

  const socialCount = data.social_count_override || String(realCount);

  if (step === "questions" && result?.post_signup) {
    return (
      <div className="w-full max-w-md mx-auto">
        <GlassCard>
          <p className="text-lg font-medium text-zinc-800 mb-4">{result.post_signup.title}</p>
          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
          <form onSubmit={handleAnswersSubmit} className="space-y-4">
            {result.post_signup.questions.map((q, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-sm text-zinc-700">
                  {q.label}
                  {q.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                {q.type === "select" ? (
                  <select
                    value={answers[q.label] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                    required={q.required}
                    className="w-full rounded-xl bg-white/70 border border-white/50 px-4 py-2 text-sm text-zinc-800"
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
                    className="w-full rounded-xl bg-white/70 border border-white/50 px-4 py-2 text-sm text-zinc-800"
                  />
                ) : (
                  <input
                    type="text"
                    value={answers[q.label] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                    required={q.required}
                    className="w-full rounded-xl bg-white/70 border border-white/50 px-4 py-2 text-sm text-zinc-800"
                  />
                )}
              </div>
            ))}
            <button
              type="submit"
              disabled={savingAnswers}
              className="w-full rounded-full font-semibold px-4 py-2.5 text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
            >
              {savingAnswers ? "Saving..." : "Continue"}
            </button>
          </form>
        </GlassCard>
      </div>
    );
  }

  if (step === "done" && result) {
    return (
      <div className="w-full max-w-md mx-auto">
        <GlassCard>
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-bold text-zinc-800">You&apos;re in!</h2>
            <p className="text-zinc-700">
              You&apos;re <span className="font-semibold text-zinc-800">#{result.position ?? "?"}</span> in
              line.
            </p>

            <div>
              <p className="text-sm text-zinc-700 mb-2">Share your referral link</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={result.referral_link}
                  className="flex-1 rounded-full bg-white/70 border border-white/50 px-4 py-2 text-xs font-mono text-zinc-700"
                />
                <button
                  onClick={copyReferralLink}
                  className="rounded-full font-semibold px-4 text-sm text-white transition hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? "w-full px-4 py-6 flex justify-center"
          : "min-h-screen w-full flex flex-col items-center justify-center px-4 py-12"
      }
      style={{
        backgroundImage: "linear-gradient(120deg, #fbcfe8 0%, #e9d5ff 35%, #c7d2fe 70%, #bfdbfe 100%)",
        backgroundSize: "200% 200%",
        animation: "pastel-shift 12s ease-in-out infinite",
      }}
    >
      <div className="w-full max-w-md relative">
        <GlassCard>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-zinc-800 leading-tight">{data.title}</h1>
            {data.subtitle && <p className="mt-3 text-zinc-700">{data.subtitle}</p>}

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

            <form onSubmit={handleSubmit} className="mt-8 text-left">
              <div className="flex items-center rounded-full bg-white/80 border border-white/50 shadow-inner p-1">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="shrink-0 rounded-full font-semibold px-4 py-1.5 text-sm text-white transition hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                  style={{ backgroundColor: ACCENT }}
                >
                  {loading ? "Joining..." : data.cta_label}
                </button>
              </div>
              <div ref={turnstileRef} className="cf-turnstile hidden" />
            </form>

            {data.show_social_proof && (
              <p className="mt-6 text-sm text-zinc-700">
                {data.badge_text.replace("8,000+", socialCount)}
              </p>
            )}
          </div>
        </GlassCard>

        {data.floating_tags.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {data.floating_tags.map((tag, i) => {
              const tone = TAG_COLORS[i % TAG_COLORS.length];
              return (
                <span
                  key={i}
                  className="rounded-full border border-white/40 px-3 py-1 text-xs backdrop-blur-md animate-float"
                  style={{
                    backgroundColor: tone.bg,
                    color: tone.fg,
                    animationDelay: `${i * 0.4}s`,
                  }}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-3xl border border-white/15 p-8 shadow-xl backdrop-blur-xl"
      style={{ backgroundColor: "rgba(255,255,255,0.35)" }}
    >
      {children}
    </div>
  );
}
