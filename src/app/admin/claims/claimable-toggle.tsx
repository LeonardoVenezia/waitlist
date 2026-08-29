"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setShowcaseClaimable } from "./actions";

type State = { error?: string; success?: boolean } | null;

export function ClaimableToggle({
  showcaseId,
  initial,
}: {
  showcaseId: string;
  initial: boolean;
}) {
  const [optimistic, setOptimistic] = useState(initial);
  const router = useRouter();

  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => setShowcaseClaimable(null, formData),
    null,
  );

  // Apply server result: keep optimistic value in sync.
  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state?.success, router]);

  const targetValue = !optimistic;

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="showcase_id" value={showcaseId} />
      <input type="hidden" name="claimable" value={String(targetValue)} />
      <button
        type="submit"
        disabled={pending}
        onClick={() => setOptimistic(targetValue)}
        className={
          optimistic
            ? "inline-flex h-8 items-center justify-center rounded-lg border bg-success/10 px-3 text-sm font-medium text-success hover:bg-success/20 disabled:opacity-50"
            : "inline-flex h-8 items-center justify-center rounded-lg border bg-muted px-3 text-sm font-medium text-muted-foreground hover:bg-muted/70 disabled:opacity-50"
        }
      >
        {pending ? "..." : optimistic ? "Claimable" : "Locked"}
      </button>
      {state?.error && (
        <span className="text-xs text-destructive">{state.error}</span>
      )}
    </form>
  );
}
