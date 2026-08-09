"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";

declare global {
  interface Window {
    turnstile?: {
      render: (el: string | HTMLElement, opts: Record<string, unknown>) => string;
      execute: (el: string | HTMLElement, opts?: Record<string, unknown>) => void;
      reset: (el: string | HTMLElement) => void;
    };
    onTestimonialTurnstile?: (token: string) => void;
  }
}

interface TestimonialFormProps {
  formId: string;
  projectId: string;
  fields: string[];
  questions: Record<string, unknown>[];
  redirectUrl: string | null;
}

export function TestimonialForm({ formId, projectId, fields, questions, redirectUrl }: TestimonialFormProps) {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<string | null>(null);
  const turnstileEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptId = "cf-turnstile-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const interval = setInterval(() => {
      if (window.turnstile && turnstileEl.current && !turnstileRef.current) {
        window.onTestimonialTurnstile = (token: string) => {
          setTurnstileToken(token);
        };
        turnstileRef.current = window.turnstile.render(turnstileEl.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
          callback: "onTestimonialTurnstile",
        });
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!turnstileToken) return;
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      form_id: formId,
      project_id: projectId,
      rating,
      turnstile_token: turnstileToken,
    };

    fields.forEach((f) => {
      const val = fd.get(f);
      if (val) body[f] = val;
    });

    try {
      const res = await fetch("/api/testimonials/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Something went wrong");
        setLoading(false);
        window.turnstile?.reset(turnstileEl.current!);
        setTurnstileToken(null);
        return;
      }

      setSubmitted(true);

      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 2000);
      }
    } catch {
      alert("Network error. Try again.");
      setLoading(false);
      window.turnstile?.reset(turnstileEl.current!);
      setTurnstileToken(null);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="size-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
          <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="font-heading text-lg font-semibold mb-1">Thank you!</h3>
        <p className="text-sm text-muted-foreground">Your testimonial has been submitted.</p>
        {redirectUrl && (
          <p className="text-xs text-muted-foreground mt-2">Redirecting...</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.includes("name") && (
        <div>
          <label className="text-sm font-medium">Name *</label>
          <input
            name="name"
            required
            className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {fields.includes("email") && (
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {fields.includes("company") && (
        <div>
          <label className="text-sm font-medium">Company</label>
          <input
            name="company"
            className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {fields.includes("role") && (
        <div>
          <label className="text-sm font-medium">Role</label>
          <input
            name="role"
            className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {fields.includes("rating") && (
        <div>
          <label className="text-sm font-medium mb-1.5 block">Rating</label>
          <StarRating value={rating} onChange={setRating} size="lg" />
        </div>
      )}

      {fields.includes("message") && (
        <div>
          <label className="text-sm font-medium">Message *</label>
          <textarea
            name="message"
            required
            rows={4}
            className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary resize-y"
          />
        </div>
      )}

      {questions.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-3">Additional questions</p>
          {questions.map((q, i) => (
            <div key={i} className="mb-3">
              <label className="text-sm font-medium">
                {(q.label as string) ?? `Question ${i + 1}`}
                {q.required ? " *" : ""}
              </label>
              {q.type === "textarea" ? (
                <textarea
                  name={`question_${i}`}
                  required={!!q.required}
                  rows={3}
                  className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                />
              ) : q.type === "select" && Array.isArray(q.options) ? (
                <select
                  name={`question_${i}`}
                  required={!!q.required}
                  className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select...</option>
                  {(q.options as string[]).map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  name={`question_${i}`}
                  required={!!q.required}
                  className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div ref={turnstileEl} className="flex justify-center" />

      <Button type="submit" disabled={loading || !turnstileToken} className="w-full">
        {loading ? "Submitting..." : "Submit testimonial"}
      </Button>
    </form>
  );
}
