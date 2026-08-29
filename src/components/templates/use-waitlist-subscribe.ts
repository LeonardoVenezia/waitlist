"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export interface SubscribeResult {
  id: string;
  email: string;
  position: number | null;
  referral_code: string;
  referral_link: string;
  referral_count: number;
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

export function useWaitlistSubscribe(
  publicKey: string,
  options?: { preview?: boolean },
) {
  const isPreview = options?.preview ?? false;
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? undefined;
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorParam ?? null);
  const [result, setResult] = useState<SubscribeResult | null>(null);
  const [step, setStep] = useState<"subscribe" | "questions" | "done">("subscribe");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savingAnswers, setSavingAnswers] = useState(false);
  const [copied, setCopied] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);

  // ponytail: in preview mode (e.g. dashboard page builder), we short-circuit
  // the fetch and return a fake "done" state so iterating doesn't pollute
  // the subscribers table.
  async function doPreviewSubmit() {
    await new Promise((r) => setTimeout(r, 600));
    setResult({
      id: "preview",
      email,
      position: 1,
      referral_code: "preview",
      referral_link: "/preview",
      referral_count: 0,
    });
    setStep("done");
    setLoading(false);
  }

  async function doSubmit(token: string) {
    if (isPreview) {
      await doPreviewSubmit();
      return;
    }
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
      setStep(data.post_signup ? "questions" : "done");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetTurnstile() {
    const el = turnstileRef.current?.querySelector<HTMLIFrameElement>("iframe")?.parentElement;
    if (el && window.turnstile) {
      try {
        window.turnstile.reset(el);
      } catch {
        // ignore
      }
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

    if (window.turnstile) {
      const el = turnstileRef.current?.querySelector<HTMLIFrameElement>("iframe")?.parentElement;
      if (el) {
        (window as unknown as Record<string, (token: string) => void>).__cfTurnstileCb = async (
          token: string,
        ) => {
          delete (window as unknown as Record<string, unknown>).__cfTurnstileCb;
          await doSubmit(token);
        };
        try {
          window.turnstile.execute(el, { callback: "__cfTurnstileCb" });
        } catch {
          await doSubmit("");
        }
        return;
      }
    }

    await doSubmit("");
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

  return {
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
    resetTurnstile,
    copyReferralLink,
    handleAnswersSubmit,
  };
}
