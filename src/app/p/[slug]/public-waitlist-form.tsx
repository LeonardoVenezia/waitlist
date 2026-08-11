"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WaitlistFormProps {
  publicKey: string;
  waitlistId: string;
  settings: Record<string, unknown>;
  slug: string;
  ctaLabel?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  showCount?: boolean;
  showLeaderboard?: boolean;
}

interface SubscribeResult {
  id: string;
  email: string;
  position: number;
  referral_code: string;
  referral_link: string;
  leaderboard?: Array<{ position: number; email: string; referral_count: number }>;
  milestones?: Array<{ count: number; reward: string }>;
  reward_text?: string | null;
  post_signup?: {
    title: string;
    questions: Array<{
      type: "text" | "textarea" | "select";
      label: string;
      required?: boolean;
      options?: string[];
    }>;
  } | null;
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: string | HTMLElement, opts: Record<string, unknown>) => string;
      execute: (el: string | HTMLElement, opts?: Record<string, unknown>) => void;
      reset: (el: string | HTMLElement) => void;
    };
    __cfTurnstileCallback?: (token: string) => void;
  }
}

export function PublicWaitlistForm({ publicKey, settings, ctaLabel, buttonColor, buttonTextColor, showCount = true, showLeaderboard = true }: WaitlistFormProps) {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? undefined;
  const errorParam = searchParams.get("error");

  const thankYou = (settings.thank_you ?? {}) as Record<string, unknown>;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorParam ?? null);
  const [result, setResult] = useState<SubscribeResult | null>(null);
  const [step, setStep] = useState<"subscribe" | "questions" | "done">("subscribe");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savingAnswers, setSavingAnswers] = useState(false);
  const [copied, setCopied] = useState(false);
  const [turnstileReady, setTurnstileReady] = useState(true);
  const turnstileToken = useRef<string>("");
  const turnstileRef = useRef<HTMLDivElement>(null);

  // Expose callback globally for implicit turnstile
  useEffect(() => {
    (window as unknown as Record<string, (token: string) => void>).handleTurnstileCallback = (token: string) => {
      turnstileToken.current = token;
    };
  }, []);

  // Reset turnstile after use so each submit triggers a new challenge
  function resetTurnstile() {
    const el = turnstileRef.current?.querySelector<HTMLIFrameElement>("iframe")?.parentElement;
    if (el && window.turnstile) {
      try { window.turnstile.reset(el); } catch {}
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      await doSubmit("");
      return;
    }

    // Trigger implicit turnstile challenge
    if (window.turnstile) {
      const el = turnstileRef.current?.querySelector<HTMLIFrameElement>("iframe")?.parentElement;
      if (el) {
        (window as unknown as Record<string, (token: string) => void>).__cfTurnstileCb = async (token: string) => {
          delete (window as unknown as Record<string, unknown>).__cfTurnstileCb;
          await doSubmit(token);
        };
        try { window.turnstile.execute(el, { callback: "__cfTurnstileCb" }); } catch {
          await doSubmit("");
        }
        return;
      }
    }
    await doSubmit("");
  }

  async function doSubmit(token: string) {
    try {
      const body: Record<string, string> = {
        public_key: publicKey,
        email,
      };
      if (refCode) body.ref = refCode;
      if (token) body.turnstile_token = token;

      const res = await fetch("/api/public/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setResult(data);
      // If post-signup questions are enabled, go to questions step
      if (data.post_signup) {
        setStep("questions");
      } else {
        setStep("done");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyReferralLink() {
    if (!result) return;
    navigator.clipboard.writeText(result.referral_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAnswersSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!result?.post_signup) return;
    setSavingAnswers(true);
    setError(null);

    const res = await fetch("/api/public/subscriber", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriber_id: result.id, answers }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      setSavingAnswers(false);
      return;
    }

    setSavingAnswers(false);
    setStep("done");
  }

  // Post-signup questions step
  if (step === "questions" && result?.post_signup) {
    const ps = result.post_signup;
    return (
      <div className="space-y-4">
        {ps.title && <p className="text-lg font-medium">{ps.title}</p>}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        <form onSubmit={handleAnswersSubmit} className="space-y-4">
          {ps.questions.map((q, i) => (
            <div key={i} className="space-y-1.5 text-left">
              <Label>
                {q.label}
                {q.required && <span className="text-red-500 ml-0.5">*</span>}
              </Label>
              {q.type === "select" ? (
                <select
                  value={answers[q.label] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                  required={q.required}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm"
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
                  className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                  rows={3}
                />
              ) : (
                <Input
                  type="text"
                  value={answers[q.label] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
                  required={q.required}
                />
              )}
            </div>
          ))}
          <Button type="submit" className="w-full" disabled={savingAnswers} style={buttonColor ? { backgroundColor: buttonColor, color: buttonTextColor ?? "#fff", borderColor: buttonColor } : undefined}>
            {savingAnswers ? "Saving..." : "Continue"}
          </Button>
        </form>
      </div>
    );
  }

  // Success state
  if (step === "done" && result) {
    const showMilestones = result.milestones && result.milestones.length > 0;
    const positionText = (thankYou.position_text as string) || "Your position: #{POSITION}";
    const referralPrompt = (thankYou.description as string) || "Share your referral link to climb the ranks:";
    return (
      <div className="space-y-4">
        {(thankYou.title as string) && (
          <p className="text-lg font-semibold">{thankYou.title as string}</p>
        )}
        {(thankYou.subtitle as string) && (
          <p className="text-sm text-muted-foreground">{thankYou.subtitle as string}</p>
        )}
        {(thankYou.message as string) ? (
          <p className="text-sm text-muted-foreground">{thankYou.message as string}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            You&apos;re on the list!{thankYou.show_position !== false && result.position
              ? positionText.replace("{POSITION}", String(result.position))
              : ""}
          </p>
        )}

        {result.reward_text && (
          <p className="text-sm font-medium text-primary">{result.reward_text}</p>
        )}

        {thankYou.show_referral_link !== false && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{referralPrompt}</p>
            <div className="flex gap-2">
              <Input
                value={result.referral_link}
                readOnly
                className="font-mono text-xs"
              />
              <Button onClick={copyReferralLink} variant="outline" size="sm">
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        )}

        {showLeaderboard && thankYou.show_leaderboard !== false && result.leaderboard && result.leaderboard.length > 0 && (
          <div className="rounded-lg border p-4 text-left">
            <h3 className="mb-2 text-sm font-medium">Leaderboard</h3>
            <div className="space-y-1 text-sm">
              {result.leaderboard.map((entry) => (
                <div key={entry.position} className="flex items-center justify-between">
                  <span>
                    <span className="font-medium">#{entry.position}</span>{" "}
                    {entry.email.split("@")[0]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.referral_count} referral{entry.referral_count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showMilestones && (
          <div className="rounded-lg border p-4 text-left">
            <h3 className="mb-2 text-sm font-medium">Rewards</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {result.milestones!.map((m, i) => (
                <li key={i}>🎁 {m.reward} at {m.count} referrals</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Form state
  const hero = (settings.hero ?? {}) as Record<string, unknown>;

  return (
    <>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Turnstile implicit widget */}
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <div ref={turnstileRef} className="cf-turnstile hidden" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} data-size="invisible" data-callback="handleTurnstileCallback" />
        )}

        <Button type="submit" className="w-full" disabled={loading} style={buttonColor ? { backgroundColor: buttonColor, color: buttonTextColor ?? "#fff", borderColor: buttonColor } : undefined}>
          {loading ? "Joining..." : ctaLabel || hero.cta_label as string || "Join the waitlist"}
        </Button>
      </form>
    </>
  );
}
