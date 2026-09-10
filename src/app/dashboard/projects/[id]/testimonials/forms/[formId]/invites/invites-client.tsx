"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { sendInvites, resendInvite } from "@/lib/testimonials/actions";

interface InviteRow {
  id: string;
  email: string;
  status: "queued" | "sent" | "opened" | "submitted";
  sentAt: string | null;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InvitesClient({
  projectId,
  formId,
  formPublished,
  invites,
  statusDots,
}: {
  projectId: string;
  formId: string;
  formPublished: boolean;
  invites: InviteRow[];
  statusDots: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [emails, setEmails] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setFeedback(null);
    setError(null);
    try {
      const result = await sendInvites(projectId, formId, emails);
      setEmails("");
      const parts = [`${result.queued} invite${result.queued === 1 ? "" : "s"} queued`];
      if (result.duplicates > 0) parts.push(`${result.duplicates} re-invited`);
      if (result.invalid.length > 0) parts.push(`invalid: ${result.invalid.join(", ")}`);
      setFeedback(parts.join(" · "));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send invites");
    }
  }

  function handleResend(inviteId: string) {
    startTransition(async () => {
      try {
        await resendInvite(projectId, inviteId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to resend");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Composer */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-medium text-sm mb-1">Request testimonials</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Paste emails separated by commas or new lines. The email asks for a
          testimonial and links to your form.
        </p>
        <textarea
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          rows={4}
          placeholder={"cliente@ejemplo.com\notro@empresa.com"}
          className="block w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary resize-y"
        />
        {!formPublished && (
          <p className="text-xs text-amber-600 mt-2">
            The form is a draft — publish it so recipients can submit.
          </p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <Button onClick={handleSend} disabled={!emails.trim()}>
            Send invites
          </Button>
          {feedback && <span className="text-xs text-muted-foreground">{feedback}</span>}
        </div>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>

      {/* List */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="font-medium text-sm">Sent invites</h3>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-wide text-muted-foreground">
            {(["queued", "sent", "opened", "submitted"] as const).map((s) => (
              <span key={s} className="flex items-center gap-1">
                <span className={`size-1.5 rounded-full ${statusDots[s]}`} />
                {s}
              </span>
            ))}
          </div>
        </div>

        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground px-5 py-8 text-center">
            No invites yet.
          </p>
        ) : (
          <ul className="divide-y">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`size-2 rounded-full shrink-0 ${statusDots[inv.status] ?? "bg-muted-foreground/40"}`} />
                <span className="text-sm truncate min-w-0 flex-1">{inv.email}</span>
                <span className="text-xs text-muted-foreground shrink-0 w-28 text-right">
                  {formatDate(inv.sentAt)}
                </span>
                <span className="text-xs capitalize text-muted-foreground shrink-0 w-20 text-right">
                  {inv.status}
                </span>
                <button
                  type="button"
                  onClick={() => handleResend(inv.id)}
                  disabled={pending || inv.status === "queued"}
                  className="text-xs text-primary hover:underline shrink-0 disabled:opacity-40 disabled:no-underline"
                >
                  Resend
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
