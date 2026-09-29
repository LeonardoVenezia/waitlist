"use client";

import { useWaitlistSubscribe } from "./use-waitlist-subscribe";
import type { AuroraTemplateData } from "@/lib/templates";
import type { ThankYouConfig } from "@/lib/thank-you-experiences";
import { Embajadores } from "@/components/thank-you/embajadores";

// Aurora is an editorial hero: the gradient IS the page, with a grain layer on
// top so it doesn't read as a flat CSS gradient. Committed to dawn (peach →
// pink → violet) — the dark variant would be a builder field.
//
// White type over a warm gradient is the classic way this style ships broken,
// so the stops are mid-to-deep rather than pastel and a full-bleed scrim sits
// between the gradient and the content. The glass surfaces are ink-tinted for
// the same reason: translucent white over a light stop cannot hold white text.

const GRADIENT =
  "linear-gradient(160deg, #F08A63 0%, #E2668F 30%, #A44FD6 66%, #5633C4 100%)";

const SCRIM =
  "linear-gradient(180deg, rgba(18,12,28,0.32) 0%, rgba(18,12,28,0.48) 28%, rgba(18,12,28,0.48) 74%, rgba(18,12,28,0.32) 100%)";

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// The CTA is solid ink: the only way to get real contrast against a translucent
// surface sitting on a saturated gradient.
const INK = "#141019";

const GLASS = "border border-white/25 bg-[#160F20]/30 backdrop-blur-xl";

// Kept inside the scrimmed band so the chips always sit on a darkened area.
const CHIP_SPOTS = [
  { top: "24%", left: "6%" },
  { top: "38%", right: "5%" },
  { top: "62%", left: "9%" },
  { top: "72%", right: "8%" },
  { top: "14%", left: "26%" },
  { top: "82%", left: "40%" },
];

export function AuroraTemplate({
  publicKey,
  data,
  realCount,
  embedded = false,
  preview = false,
  thankYou,
}: {
  publicKey: string;
  data: AuroraTemplateData;
  realCount: number;
  embedded?: boolean;
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

  const override = data.social_count_override.trim();
  const socialLine = override
    ? `${override} people already in line`
    : realCount === 1
      ? "1 person already in line"
      : realCount > 1
        ? `${new Intl.NumberFormat("en-US").format(realCount)} people already in line`
        : "Be the first in line";

  // `*word*` renders as serif italics; React escapes the rest for us.
  const titleParts = data.title.split(/\*([^*]+)\*/g);

  // The project can override the post-signup screen: when it does, this
  // template's own done state is skipped entirely.
  if (step === "done" && result && thankYou.experience === "embajadores") {
    return (
      <Embajadores config={thankYou} result={result} copied={copied} onCopy={copyReferralLink} />
    );
  }

  return (
    <div
      className={
        embedded
          ? "relative flex min-h-[520px] w-full flex-col overflow-hidden"
          : "relative flex min-h-screen w-full flex-col overflow-hidden"
      }
      style={{ backgroundImage: GRADIENT }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: SCRIM }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundRepeat: "repeat" }}
      />

      {!embedded && (
        <nav className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-10">
          <span aria-hidden className="flex items-center gap-2">
            <span
              className="size-4 rounded-full"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #FFD9B7 0%, #FF7FA8 50%, #7C5CE6 100%)",
              }}
            />
            <span className="h-px w-6 bg-white/40" />
          </span>
          <a
            href="#join"
            className={`${GLASS} rounded-full px-4 py-1.5 text-[13px] font-medium text-white transition hover:bg-[#160F20]/45`}
          >
            {data.cta_label}
          </a>
        </nav>
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 hidden lg:block"
      >
        {data.floating_tags.map((tag, i) => (
          <span
            key={i}
            className={`${GLASS} animate-float absolute rounded-full px-3.5 py-1.5 text-[13px] text-white/95 motion-reduce:animate-none`}
            style={{ ...CHIP_SPOTS[i % CHIP_SPOTS.length], animationDelay: `${i * 0.45}s` }}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
        {step === "questions" && result?.post_signup ? (
          <div className={`${GLASS} w-full max-w-md rounded-3xl p-7 text-left`}>
            <h2 className="font-heading text-2xl text-white">
              {result.post_signup.title}
            </h2>
            {error && (
              <p role="alert" className="mt-4 text-sm text-white/90">
                {error}
              </p>
            )}
            <form onSubmit={handleAnswersSubmit} className="mt-6 space-y-5">
              {result.post_signup.questions.map((q, i) => (
                <div key={i} className="space-y-2">
                  <label className="block text-[13px] text-white/80">
                    {q.label}
                    {q.required && <span className="ml-0.5 text-white">*</span>}
                  </label>
                  {q.type === "select" ? (
                    <select
                      value={answers[q.label] ?? ""}
                      onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                      required={q.required}
                      className="w-full rounded-xl border border-white/25 bg-[#160F20]/40 px-3.5 py-2.5 text-[15px] text-white"
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
                      className="w-full resize-y rounded-xl border border-white/25 bg-[#160F20]/40 px-3.5 py-2.5 text-[15px] text-white"
                    />
                  ) : (
                    <input
                      type="text"
                      value={answers[q.label] ?? ""}
                      onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                      required={q.required}
                      className="w-full rounded-xl border border-white/25 bg-[#160F20]/40 px-3.5 py-2.5 text-[15px] text-white"
                    />
                  )}
                </div>
              ))}
              <button
                type="submit"
                disabled={savingAnswers}
                style={{ backgroundColor: INK }}
                className="w-full rounded-xl px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {savingAnswers ? "Sending…" : "Continue"}
              </button>
            </form>
          </div>
        ) : step === "done" && result ? (
          <div className={`${GLASS} w-full max-w-md rounded-3xl p-8 text-center`}>
            <h2 className="font-heading text-3xl text-white">You&apos;re in</h2>
            <p className="mt-3 text-white/85">
              You&apos;re <span className="font-medium text-white">#{result.position ?? "—"}</span> in line.
            </p>
            <div className="mt-7 text-left">
              <p className="text-[13px] text-white/80">Your referral link</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={result.referral_link}
                  aria-label="Your referral link"
                  className="min-w-0 flex-1 rounded-xl border border-white/25 bg-[#160F20]/40 px-3.5 py-2.5 text-xs text-white/90"
                />
                <button
                  type="button"
                  onClick={copyReferralLink}
                  style={{ backgroundColor: INK }}
                  className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl text-center">
            <span
              className={`${GLASS} inline-flex items-center gap-2 rounded-full px-4 py-2`}
            >
              <span aria-hidden className="size-1.5 rounded-full bg-white/80" />
              <span className="text-[13px] text-white/95">{data.badge_text}</span>
            </span>

            <h1 className="mt-7 font-heading text-[clamp(2.5rem,7vw,4.75rem)] leading-[1.04] tracking-[-0.02em] text-white">
              {titleParts.map((part, i) =>
                i % 2 === 1 ? (
                  <em key={i} className="italic">
                    {part}
                  </em>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </h1>

            {data.subtitle && (
              <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-white/90 sm:text-lg">
                {data.subtitle}
              </p>
            )}

            {error && (
              <p role="alert" className="mt-6 text-sm text-white">
                {error}
              </p>
            )}

            <form
              id="join"
              onSubmit={handleSubmit}
              className={`${GLASS} mx-auto mt-10 flex w-full max-w-xl flex-col gap-2 rounded-3xl p-2 sm:flex-row`}
            >
              <label htmlFor="aurora-email" className="sr-only">
                Email address
              </label>
              <input
                id="aurora-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-w-0 flex-1 rounded-2xl bg-transparent px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/70"
              />
              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: INK }}
                className="w-full shrink-0 rounded-2xl px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none disabled:opacity-60 sm:w-auto"
              >
                {loading ? "Sending…" : data.cta_label}
              </button>
              <div ref={turnstileRef} className="cf-turnstile hidden" />
            </form>

            {data.show_social_proof && (
              <p className="mt-8 text-[13px] text-white/80">{socialLine}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
