"use client";

import { useWaitlistSubscribe } from "./use-waitlist-subscribe";
import type { NeonTemplateData } from "@/lib/templates";

const INITIALS = ["J", "M", "A", "S", "R", "L"];
const AVATAR_COLORS = ["#6366f1", "#22c55e", "#eab308", "#ec4899", "#0ea5e9", "#f97316"];

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
          <p className="text-lg font-medium mb-4">{result.post_signup.title}</p>
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
              className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2.5 transition disabled:opacity-50"
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
              <p className="mt-2 text-emerald-400 font-mono">
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
                  className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-3 text-sm transition"
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>

            <div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <ul className="mt-3 space-y-1 text-sm text-zinc-400">
                {milestoneLabels.map((m) => (
                  <li key={m.at}>
                    <span className="text-emerald-400 font-mono">{m.at}</span> · {m.label}
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
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            {data.badge_text}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-white leading-tight">{data.title}</h1>
        {data.subtitle && <p className="mt-3 text-zinc-400">{data.subtitle}</p>}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="flex rounded-xl border border-zinc-700 bg-zinc-900 p-1.5 focus-within:border-emerald-400/60">
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
              className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 text-sm transition disabled:opacity-50"
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
            <p className="text-xs text-zinc-400">
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
      className="relative rounded-2xl border border-zinc-800 bg-[#090A0F] p-8 shadow-[0_0_60px_-20px_rgba(16,185,129,0.45)]"
      style={{ boxShadow: "0 0 60px -20px rgba(16,185,129,0.45)" }}
    >
      {children}
    </div>
  );
}
