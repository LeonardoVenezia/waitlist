"use client";

import { useState } from "react";
import { useWaitlistSubscribe } from "./use-waitlist-subscribe";
import type { CarbonTemplateData } from "@/lib/templates";

export function CarbonTemplate({
  publicKey,
  data,
  realCount,
}: {
  publicKey: string;
  data: CarbonTemplateData;
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";
  const mockupUrl = data.mockup_image
    ? data.mockup_image.startsWith("http")
      ? data.mockup_image
      : `${supabaseUrl}/storage/v1/object/public/showcase-images/${data.mockup_image}`
    : "";

  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handleTilt(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 6;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 6;
    setTilt({ x, y });
  }

  function resetTilt() {
    setTilt({ x: 0, y: 0 });
  }

  if (step === "questions" && result?.post_signup) {
    return (
      <div className="w-full max-w-2xl mx-auto text-left">
        <CarbonCard>
          <p className="text-lg font-medium text-zinc-100 mb-4">{result.post_signup.title}</p>
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
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100"
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
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100"
                  />
                ) : (
                  <input
                    type="text"
                    value={answers[q.label] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                    required={q.required}
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100"
                  />
                )}
              </div>
            ))}
            <button
              type="submit"
              disabled={savingAnswers}
              className="w-full rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold px-4 py-2.5 transition disabled:opacity-50"
            >
              {savingAnswers ? "Saving..." : "Continue"}
            </button>
          </form>
        </CarbonCard>
      </div>
    );
  }

  if (step === "done" && result) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <CarbonCard>
          <div className="space-y-6 text-left">
            <p className="font-mono text-xs text-emerald-400">ACCESS GRANTED</p>
            <h2 className="text-2xl font-bold text-zinc-100">You&apos;re on the list.</h2>
            <p className="text-zinc-400">
              You&apos;re <span className="text-zinc-100 font-mono">#{result.position ?? "?"}</span> in
              line.
            </p>

            <div>
              <p className="text-sm text-zinc-300 mb-2">Share your referral link</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={result.referral_link}
                  className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-200"
                />
                <button
                  onClick={copyReferralLink}
                  className="rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold px-3 text-sm transition"
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>
          </div>
        </CarbonCard>
      </div>
    );
  }

  const titleParts = data.emphasis
    ? data.title.split(data.emphasis)
    : [data.title];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-left">
        <p className="font-mono text-xs tracking-widest text-emerald-400 mb-4">{data.eyebrow}</p>
        <h1 className="text-4xl font-bold text-zinc-50 leading-tight">
          {titleParts.length > 1 ? (
            <>
              {titleParts[0]}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {data.emphasis}
              </span>
              {titleParts[1]}
            </>
          ) : (
            data.title
          )}
        </h1>
        {data.subtitle && <p className="mt-4 text-zinc-400 max-w-xl">{data.subtitle}</p>}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-8 max-w-md">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-emerald-400/70 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-3 w-full rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold px-4 py-3 text-sm transition disabled:opacity-50"
          >
            {loading ? "Requesting..." : data.cta_label}
          </button>
          <div ref={turnstileRef} className="cf-turnstile hidden" />
        </form>

        {data.show_social_proof && (
          <p className="mt-6 text-xs font-mono text-zinc-500">
            {socialCount} people already requested access
          </p>
        )}
      </div>

      <div
        onMouseMove={handleTilt}
        onMouseLeave={resetTilt}
        className="mt-12 rounded-xl border border-zinc-800 bg-[#111318] shadow-2xl"
        style={{
          transform: `perspective(1000px) rotateX(${-tilt.y}deg) rotateY(${tilt.x}deg)`,
          transition: "transform 0.15s ease-out",
        }}
      >
        <div className="flex items-center gap-1.5 border-b border-zinc-800 px-4 py-3">
          <span className="size-3 rounded-full bg-red-400/80" />
          <span className="size-3 rounded-full bg-yellow-400/80" />
          <span className="size-3 rounded-full bg-green-400/80" />
          <span className="ml-3 h-4 flex-1 rounded bg-zinc-800" />
        </div>
        <div className="p-4">
          {mockupUrl ? (
            <img src={mockupUrl} alt="Product mockup" className="w-full rounded-lg object-cover bg-zinc-900 aspect-video" />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg bg-zinc-900 text-sm text-zinc-600">
              Product mockup
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CarbonCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#111318] p-8">{children}</div>
  );
}
