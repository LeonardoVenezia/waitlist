"use client";

import { useState } from "react";
import { useWaitlistSubscribe } from "./use-waitlist-subscribe";
import type { PastelTemplateData } from "@/lib/templates";

export function PastelTemplate({
  publicKey,
  data,
  realCount,
}: {
  publicKey: string;
  data: PastelTemplateData;
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

  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handleParallax(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 4;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 4;
    setTilt({ x, y });
  }

  function resetParallax() {
    setTilt({ x: 0, y: 0 });
  }

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
              className="w-full rounded-full bg-violet-500 hover:bg-violet-400 text-white font-semibold px-4 py-2.5 transition disabled:opacity-50"
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
            <p className="text-zinc-600">
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
                  className="rounded-full bg-violet-500 hover:bg-violet-400 text-white font-semibold px-4 text-sm transition"
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
      className="w-full max-w-md mx-auto"
      onMouseMove={handleParallax}
      onMouseLeave={resetParallax}
    >
      <div className="relative">
        <GlassCard>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-zinc-800 leading-tight">{data.title}</h1>
            {data.subtitle && <p className="mt-3 text-zinc-600">{data.subtitle}</p>}

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

            <form onSubmit={handleSubmit} className="mt-8 text-left">
              <div className="flex items-center rounded-full bg-white/80 border border-white/50 shadow-inner p-1.5">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-violet-500 hover:bg-violet-400 text-white font-semibold px-4 py-2 text-sm transition disabled:opacity-50"
                >
                  {loading ? "Joining..." : data.cta_label}
                </button>
              </div>
              <div ref={turnstileRef} className="cf-turnstile hidden" />
            </form>

            {data.show_social_proof && (
              <p className="mt-6 text-sm text-zinc-600">
                {data.badge_text.replace("8,000+", socialCount)}
              </p>
            )}
          </div>
        </GlassCard>

        {data.floating_tags.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {data.floating_tags.map((tag, i) => (
              <span
                key={i}
                className="rounded-full border border-white/40 bg-white/40 px-3 py-1 text-xs text-zinc-700 backdrop-blur-md"
                style={{
                  transform: `translate(${tilt.x * (i + 1)}px, ${tilt.y * (i + 1)}px)`,
                  transition: "transform 0.2s ease-out",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/30 p-8 shadow-xl backdrop-blur-xl">
      {children}
    </div>
  );
}
