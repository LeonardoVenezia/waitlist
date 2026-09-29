"use client";

import { contrastTextOn } from "@/lib/color";
import {
  SHARE_PLATFORM_COLORS,
  buildShareLinks,
  defaultMilestones,
  formatPositionLine,
  milestoneStates,
  normalizeMilestones,
  thankYouLabels,
  type ThankYouConfig,
} from "@/lib/thank-you-experiences";
import type { SubscribeResult } from "@/components/templates/use-waitlist-subscribe";

/**
 * The "Embajadores" post-signup screen: the referral loop the subscriber lands
 * on right after joining.
 *
 * Deliberately its own light world — a project on a dark landing template still
 * gets this clear, cheerful screen, because the point here is the loop (copy
 * → share → climb), not matching the landing. All the logic lives in
 * `thank-you-experiences.ts`; this file is presentation.
 */
export function Embajadores({
  config,
  result,
  copied = false,
  onCopy,
  layout = "overlay",
}: {
  config: ThankYouConfig;
  result: SubscribeResult;
  copied?: boolean;
  onCopy?: () => void;
  /**
   * `overlay` (the real screen) escapes the landing template's shell — 5 of the
   * 7 have their own background and padding, which would frame this light
   * screen in the template's dark world. `inline` is for the dashboard preview.
   */
  layout?: "overlay" | "inline";
}) {
  const labels = thankYouLabels(config.language);
  const milestones = normalizeMilestones(result.milestones);
  const rewardList = milestones.length > 0 ? milestones : defaultMilestones(config.language);
  const progress = milestoneStates(rewardList, result.referral_count ?? 0);
  const positionLine = formatPositionLine(result.position, result.total ?? null, config.language);
  const shares = buildShareLinks({
    referralLink: result.referral_link,
    message: config.socialMessage,
    platforms: config.socialButtons,
  });
  // WhatsApp leads and gets the full width on mobile: it is how these loops
  // actually travel.
  const primary = shares.find((s) => s.platform === "whatsapp");
  const secondary = shares.filter((s) => s !== primary);

  return (
    <div
      className={
        layout === "overlay"
          ? "fixed inset-0 z-50 overflow-y-auto bg-[#F7F6F3] px-4 py-12 sm:py-16"
          : "w-full bg-[#F7F6F3] px-4 py-10"
      }
    >
      <div className="mx-auto w-full max-w-lg space-y-5">
        <header className="text-center">
          {config.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.logoUrl}
              alt=""
              className="mx-auto mb-5 h-8 w-auto object-contain"
            />
          )}
          <h1 className="font-heading text-3xl leading-tight tracking-[-0.01em] text-[#1A1714] sm:text-4xl">
            {config.title || labels.confirmed}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-[#5A534B]">
            {config.subtitle || config.message || labels.confirmedMessage}
          </p>
        </header>

        {positionLine && (
          <section className="rounded-2xl border border-[#E6E1D9] bg-white px-6 py-7 text-center">
            <p className="text-sm text-[#5A534B]">
              {positionLine.prefix}{" "}
              <span
                className="font-heading text-4xl leading-none tracking-[-0.02em] text-[#1A1714] sm:text-5xl"
                style={{ color: config.accent }}
              >
                {positionLine.position}
              </span>{" "}
              {positionLine.suffix}
            </p>
            <p className="mt-3 text-[13px] text-[#726B62]">{labels.positionNote}</p>
          </section>
        )}

        <section className="rounded-2xl border border-[#E6E1D9] bg-white p-5">
          <p className="text-sm font-medium text-[#1A1714]">{labels.yourLink}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={result.referral_link}
              aria-label={labels.yourLink}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-xl border border-[#E6E1D9] bg-[#FAF9F7] px-3.5 py-3 font-mono text-xs text-[#5A534B]"
            />
            <button
              type="button"
              onClick={onCopy}
              style={{ backgroundColor: config.accent, color: config.accentText }}
              className="shrink-0 rounded-xl px-5 py-3 text-sm font-semibold transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {copied ? labels.copied : labels.copy}
            </button>
          </div>

          {shares.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-[13px] text-[#726B62]">{labels.share}</p>
              {primary && (
                <a
                  href={primary.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: SHARE_PLATFORM_COLORS[primary.platform] ?? config.accent,
                    color: contrastTextOn(SHARE_PLATFORM_COLORS[primary.platform] ?? config.accent),
                  }}
                  className="flex w-full items-center justify-center rounded-xl px-5 py-3.5 text-[15px] font-semibold transition hover:opacity-90"
                >
                  {primary.label}
                </a>
              )}
              <div className="flex flex-wrap gap-2">
                {secondary.map((s) => {
                  const bg = SHARE_PLATFORM_COLORS[s.platform] ?? config.accent;
                  return (
                    <a
                      key={s.platform}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ backgroundColor: bg, color: contrastTextOn(bg) }}
                      className="flex-1 rounded-xl px-4 py-2.5 text-center text-[13px] font-semibold transition hover:opacity-90"
                    >
                      {s.label}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#E6E1D9] bg-white p-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-[#1A1714]">{labels.rewards}</p>
            <p className="text-[13px] text-[#726B62]">
              {result.referral_count ?? 0}{" "}
              {(result.referral_count ?? 0) === 1 ? labels.referralSingular : labels.referralPlural}
            </p>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EFEBE4]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.round(progress.progress * 100)}%`, backgroundColor: config.accent }}
            />
          </div>

          <ul className="mt-5 space-y-3">
            {progress.states.map((m, i) => {
              const earned = m.status === "earned";
              const isNext = m.status === "next";
              return (
                <li key={`${m.count}-${i}`} className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                    style={{
                      borderColor: earned || isNext ? config.accent : "#E6E1D9",
                      backgroundColor: earned ? config.accent : "transparent",
                      color: earned ? config.accentText : isNext ? config.accent : "#726B62",
                    }}
                  >
                    <MilestoneIcon index={i} earned={earned} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm ${earned ? "text-[#726B62] line-through" : "text-[#1A1714] font-medium"}`}
                    >
                      {m.reward}
                    </p>
                    <p className="text-xs text-[#726B62]">
                      {m.count} {m.count === 1 ? labels.referralSingular : labels.referralPlural}
                    </p>
                  </div>
                  {earned ? (
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{ backgroundColor: config.accent, color: config.accentText }}
                    >
                      {labels.earned}
                    </span>
                  ) : isNext ? (
                    <span className="shrink-0 text-xs font-medium" style={{ color: config.accent }}>
                      {labels.toGo} {m.remaining}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

/** A simple progression so milestones read differently at a glance. */
function MilestoneIcon({ index, earned }: { index: number; earned: boolean }) {
  const common = {
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: earned ? 2 : 1.5,
    stroke: "currentColor",
    className: "size-4",
  };
  if (index === 0) {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.5a.56.56 0 011.04 0l2.13 5.11 5.52.44a.56.56 0 01.32.98l-4.2 3.6 1.28 5.38a.56.56 0 01-.84.61L12 16.7l-4.73 2.92a.56.56 0 01-.84-.61l1.28-5.38-4.2-3.6a.56.56 0 01.32-.98l5.52-.44z" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 15.75V3m0 0L8.25 6.75M12 3l3.75 3.75M3 11.25h18" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25l4.5-4.5L12 8.25l4.5-4.5 4.5 4.5-9 9-9-9z" />
    </svg>
  );
}
