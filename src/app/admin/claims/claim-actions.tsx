"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { approveClaim, rejectClaim } from "./actions";
import { Button } from "@/components/ui/button";

type ActionState = { error?: string; success?: boolean } | null;

export function ClaimActions({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [approveState, approveAction, approvePending] = useActionState<
    ActionState,
    FormData
  >(async (_prev, formData) => approveClaim(null, formData), null);

  const [rejectState, rejectAction, rejectPending] = useActionState<
    ActionState,
    FormData
  >(async (_prev, formData) => rejectClaim(null, formData), null);

  if (approveState?.success) {
    // Soft refresh so the row disappears from pending.
    router.refresh();
  }
  if (rejectState?.success) {
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <form action={approveAction}>
        <input type="hidden" name="claim_id" value={claimId} />
        <Button type="submit" size="sm" disabled={approvePending}>
          {approvePending ? "Approving..." : "Approve"}
        </Button>
      </form>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        onClick={() => setShowRejectModal(true)}
        disabled={approvePending || rejectPending}
      >
        Reject
      </Button>

      {approveState?.error && (
        <p className="text-sm text-destructive w-full">{approveState.error}</p>
      )}

      {showRejectModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <form
            action={rejectAction}
            className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 shadow-lg"
          >
            <input type="hidden" name="claim_id" value={claimId} />
            <div>
              <h3 className="font-heading text-lg">Reject claim</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The claimant will get an email with the reason (or a generic
                rejection if you leave it blank).
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="reason"
                name="reason"
                rows={3}
                maxLength={300}
                placeholder="You don't appear to be the founder of this product."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            {rejectState?.error && (
              <p className="text-sm text-destructive">{rejectState.error}</p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowRejectModal(false)}
                disabled={rejectPending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={rejectPending}>
                {rejectPending ? "Rejecting..." : "Reject claim"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
