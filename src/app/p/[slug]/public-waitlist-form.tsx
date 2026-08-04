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
  const [copied, setCopied] = useState(false);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileToken = useRef<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Turnstile script and render invisible widget
  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      setTurnstileReady(true);
      return;
    }

    const onLoad = () => {
      if (!window.turnstile || !containerRef.current) return;
      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        size: "invisible",
        callback: (token: string) => {
          turnstileToken.current = token;
        },
      });
      turnstileWidgetId.current = id;
      setTurnstileReady(true);
    };

    if (window.turnstile) {
      onLoad();
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__cfTLOnLoad";
      script.async = true;
      script.defer = true;
      window.__cfTurnstileCallback = onLoad;
      (window as unknown as Record<string, unknown>).__cfTLOnLoad = onLoad;
      document.head.appendChild(script);
    }

    return () => {
      if (turnstileWidgetId.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    // If no siteKey configured, skip captcha
    if (!siteKey) {
      await doSubmit("");
      return;
    }

    // Execute invisible challenge, then submit when token is ready
    const originalCallback = (window as unknown as Record<string, (token: string) => void>).__cfTurnstileCallback;
    (window as unknown as Record<string, (token: string) => void>).__cfTurnstileCallback = async (token: string) => {
      if (originalCallback) originalCallback(token);
      await doSubmit(token);
    };

    if (window.turnstile && turnstileWidgetId.current) {
      window.turnstile.execute(turnstileWidgetId.current);
    }
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

  // Success state
  if (result) {
    return (
      <div className="space-y-4">
        {(thankYou.message as string) && (
          <p className="text-lg">{thankYou.message as string}</p>
        )}

        <p className="text-sm text-muted-foreground">
          You&apos;re on the list!{thankYou.show_position !== false && result.position
            ? ` Your position: #${result.position}`
            : ""}
        </p>

        {thankYou.show_referral_link !== false && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Share your referral link to climb the ranks:
            </p>
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

        {/* Invisible Turnstile container — nothing visible */}
        <div ref={containerRef} className="hidden" />

        <Button type="submit" className="w-full" disabled={loading} style={buttonColor ? { backgroundColor: buttonColor, color: buttonTextColor ?? "#fff", borderColor: buttonColor } : undefined}>
          {loading ? "Joining..." : ctaLabel || hero.cta_label as string || "Join the waitlist"}
        </Button>
      </form>
    </>
  );
}
