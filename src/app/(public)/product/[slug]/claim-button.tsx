"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClaim } from "./actions";
import { Button } from "@/components/ui/button";

export type ClaimStatus = "none" | "pending" | "approved" | "rejected";

interface Props {
  showcaseId: string;
  showcaseSlug: string;
  isAuthed: boolean;
  claimStatus: ClaimStatus;
  claimReason?: string | null;
  /** Path to the user dashboard once approved. */
  dashboardPath?: string;
}

type ClaimFormState = { error?: string; success?: boolean } | null;

export function ClaimButton({
  showcaseId,
  showcaseSlug,
  isAuthed,
  claimStatus,
  claimReason,
  dashboardPath = "/dashboard",
}: Props) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [state, formAction, pending] = useActionState<ClaimFormState, FormData>(
    async (_prev, formData) => createClaim(null, formData),
    null,
  );

  // Close the dialog after a successful claim.
  useEffect(() => {
    if (state?.success) {
      // Refresh the server component to pick up the new claim status badge.
      router.refresh();
    }
  }, [state?.success, router]);

  // Close on escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Click outside to close.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Static states — no modal needed.
  if (claimStatus === "pending") {
    return (
      <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Claim submitted</p>
        <p className="mt-1">We&apos;ll review it and email you once it&apos;s approved.</p>
      </div>
    );
  }

  if (claimStatus === "approved") {
    return (
      <div className="rounded-xl border bg-success/10 p-4 text-sm">
        <p className="font-medium text-foreground">This is your project</p>
        <p className="mt-1 text-muted-foreground">
          Manage it from your dashboard.
        </p>
        <a
          href={dashboardPath}
          className="mt-3 inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Go to dashboard
        </a>
      </div>
    );
  }

  if (claimStatus === "rejected") {
    return (
      <div className="rounded-xl border bg-destructive/5 p-4 text-sm">
        <p className="font-medium text-foreground">Your claim was not approved</p>
        {claimReason && (
          <p className="mt-1 text-muted-foreground">{claimReason}</p>
        )}
      </div>
    );
  }

  // claimStatus === "none" — show the button.
  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        variant="outline"
        className="w-full sm:w-auto"
      >
        Claim this product
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div
            ref={dialogRef}
            className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg"
          >
            {!isAuthed ? (
              <AuthPrompt
                showcaseSlug={showcaseSlug}
                onCancel={() => setOpen(false)}
              />
            ) : (
              <ClaimForm
                showcaseId={showcaseId}
                state={state}
                formAction={formAction}
                pending={pending}
                onCancel={() => setOpen(false)}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function AuthPrompt({
  showcaseSlug,
  onCancel,
}: {
  showcaseSlug: string;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-lg">Create an account to claim</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          You need an account before you can claim this product. We&apos;ll bring
          you back here after you sign up.
        </p>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <a
          href={`/signup?next=/product/${showcaseSlug}&claim=${encodeURIComponent(showcaseSlug)}`}
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Create account
        </a>
        <a
          href={`/login?next=/product/${showcaseSlug}`}
          className="inline-flex h-8 items-center justify-center rounded-lg border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          I already have an account
        </a>
      </div>
    </div>
  );
}

function ClaimForm({
  showcaseId,
  state,
  formAction,
  pending,
  onCancel,
}: {
  showcaseId: string;
  state: ClaimFormState;
  formAction: (formData: FormData) => void;
  pending: boolean;
  onCancel: () => void;
}) {
  if (state?.success) {
    return (
      <div className="space-y-3 text-center">
        <h3 className="font-heading text-lg">Claim submitted</h3>
        <p className="text-sm text-muted-foreground">
          We&apos;ll review it shortly. You&apos;ll get an email at the address
          tied to your account.
        </p>
        <Button type="button" onClick={onCancel} className="w-full">
          Got it
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="showcase_id" value={showcaseId} />
      <div>
        <h3 className="font-heading text-lg">Claim this product</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us briefly why you&apos;re the right owner. Optional, but it
          speeds up approval.
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium">
          Message <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={500}
          placeholder="I built this product and want to manage it here."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting..." : "Submit claim"}
        </Button>
      </div>
    </form>
  );
}
