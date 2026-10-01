"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { confirmLegacyTestimonialConsent } from "@/lib/testimonials/actions";

export function ConsentConfirmation({ projectId, testimonialId }: { projectId: string; testimonialId: string }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setError(null);
    startTransition(async () => {
      try {
        await confirmLegacyTestimonialConsent(projectId, testimonialId);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not record permission.");
      }
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <p className="text-sm">This testimonial has no recorded usage choice. Keep it private unless the author has already granted permission for public use.</p>
      <Checkbox
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
        label="I confirm the author gave permission to publish this testimonial."
      />
      <Button type="button" size="sm" onClick={confirm} disabled={!checked || pending}>
        {pending ? "Recording permission…" : "Record public-use permission"}
      </Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
