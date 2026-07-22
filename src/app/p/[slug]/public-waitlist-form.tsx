"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WaitlistFormProps {
  publicKey: string;
  waitlistId: string;
  settings: Record<string, unknown>;
  slug: string;
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
    turnstileCallback?: (token: string) => void;
  }
}

export function PublicWaitlistForm({ publicKey, settings }: WaitlistFormProps) {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? undefined;
  const errorParam = searchParams.get("error");

  const thankYou = (settings.thank_you ?? {}) as Record<string, unknown>;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorParam ?? null);
  const [result, setResult] = useState<SubscribeResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Load Turnstile script and render manually
  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) return;

    const containerId = "turnstile-widget";

    // Load the script if not already present
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=turnstileReady";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    // Define the global onload callback
    (window as any).turnstileReady = () => {
      const el = document.getElementById(containerId);
      if (el && (window as any).turnstile) {
        (window as any).turnstile.render("#" + containerId, {
          sitekey: siteKey,
          callback: (token: string) => setTurnstileToken(token),
        });
      }
    };

    // If turnstile already loaded, render immediately
    if ((window as any).turnstile) {
      (window as any).turnstileReady();
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!turnstileToken) {
      setError("Please complete the captcha");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/public/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_key: publicKey,
          email,
          ref: refCode,
          turnstile_token: turnstileToken,
        }),
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

        {thankYou.show_leaderboard !== false && result.leaderboard && result.leaderboard.length > 0 && (
          <div className="rounded-lg border p-4 text-left">
            <h3 className="mb-2 text-sm font-semibold">Leaderboard</h3>
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
  return (
    <>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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

        <div
          className="cf-turnstile flex justify-center"
          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          data-callback="turnstileCallback"
        />

        <Button type="submit" className="w-full" disabled={loading || !turnstileToken}>
          {loading ? "Joining..." : (settings.hero as Record<string, unknown>)?.cta_label as string || "Join the waitlist"}
        </Button>
      </form>
    </>
  );
}
