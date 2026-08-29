"use client";

import { useWaitlistSubscribe } from "./use-waitlist-subscribe";
import type { NeonTemplateData } from "@/lib/templates";

// The neon template is a dark, focused single-card layout with an emerald
// accent. It deliberately does NOT use the host app's tokens — the look
// is its own thing, and the user picks this template exactly for the glow.

const INITIALS = ["J", "M", "A", "S", "R", "L"];
const AVATAR_COLORS = ["#6366f1", "#22c55e", "#eab308", "#ec4899", "#0ea5e9", "#f97316"];
const ACCENT = "#22c563";

export function NeonTemplate({
  publicKey,
  data,
  realCount,
}: {
  publicKey: string;
  data: NeonTemplateData;
  realCount: number;
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
  } = useWaitlistSubscribe(publicKey);

  const socialCount = data.social_count_override || String(realCount);

  const milestoneLabels = [
    { at: 3, label: data.milestone_3_label },
    { at: 5, label: data.milestone_5_label },
    { at: 10, label: data.milestone_10_label },
  ];

  if (step === "questions" && result?.post_signup) {
    return (
      <div className="w-full max-w-md mx-auto text-left">
        <NeonCard>
          <p className="text-lg font-medium text-white mb-4">{result.post_signup.title}</p>
          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
          <form onSubmit={handleAnswersSubmit} className="space-y-4">
            {result.post_signup.questions.map((q, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-sm text-zinc-300">
                  {q.label}
                  {q.required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                {q.type === "select" ? (
                  <select
                    value={answers[q.label] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                    required={q.required}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white"
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
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white"
                  />
                ) : (
                  <input
                    type="text"
                    value={answers[q.label] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                    required={q.required}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white"
                  />
                )}
              </div>
            ))}
            <button
              type="submit"
              disabled={savingAnswers}
              className="w-full rounded-lg font-semibold px-4 py-2.5 text-black transition disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
            >
              {savingAnswers ? "Saving..." : "Continue"}
            </button>
          </form>
        </NeonCard>
      </div>
    );
  }

  if (step === "done" && result) {
    const progress = Math.min((result.referral_count ?? 0) / 10, 1) * 100;
    return (
      <div className="w-full max-w-md mx-auto">
        <NeonCard>
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-bold text-white">You&apos;re on the list!</h2>
              <p className="mt-2 font-mono" style={{ color: ACCENT }}>
                You&apos;re #{result.position ?? "?"} in line
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-300 mb-2">Share your referral link</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={result.referral_link}
                  className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs font-mono text-zinc-200"
                />
                <button
                  onClick={copyReferralLink}
                  className="rounded-lg font-semibold px-3 text-sm text-black transition hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>

            <div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{ width: `${progress}%`, backgroundColor: ACCENT }}
                />
              </div>
              <ul className="mt-3 space-y-1 text-sm text-zinc-300">
                {milestoneLabels.map((m) => (
                  <li key={m.at}>
                    <span className="font-mono" style={{ color: ACCENT }}>{m.at}</span> · {m.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </NeonCard>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <NeonCard>
        <div className="mb-6">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
            style={{ borderColor: `${ACCENT}55`, color: ACCENT, backgroundColor: `${ACCENT}1A` }}
          >
            <span className="relative flex size-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: ACCENT }}
              />
              <span
                className="relative inline-flex size-2 rounded-full"
                style={{ backgroundColor: ACCENT }}
              />
            </span>
            {data.badge_text}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-white leading-tight">{data.title}</h1>
        {data.subtitle && <p className="mt-3 text-zinc-300">{data.subtitle}</p>}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-8">
          <div
            className="flex rounded-xl border border-zinc-700 bg-zinc-900 p-1.5 focus-within:border-emerald-500/60"
          >
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg font-semibold px-4 text-sm text-black transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
            >
              {loading ? "Joining..." : data.cta_label}
            </button>
          </div>

          <div ref={turnstileRef} className="cf-turnstile hidden" />
        </form>

        {data.show_social_proof && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {INITIALS.map((initial, i) => (
                <span
                  key={i}
                  className="flex size-7 items-center justify-center rounded-full border border-zinc-800 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: AVATAR_COLORS[i] }}
                >
                  {initial}
                </span>
              ))}
            </div>
            <p className="text-xs text-zinc-300">
              Join <span className="text-zinc-200 font-medium">{socialCount}</span> members
            </p>
          </div>
        )}
      </NeonCard>
    </div>
  );
}

function NeonCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative rounded-2xl border border-zinc-800 p-8"
      style={{ backgroundColor: "#090A0F", boxShadow: "0 0 60px -20px rgba(34,197,99,0.45)" }}
    >
      {children}
    </div>
  );
}
