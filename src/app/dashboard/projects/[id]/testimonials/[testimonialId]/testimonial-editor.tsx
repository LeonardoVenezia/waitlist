"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateTestimonial } from "@/lib/testimonials/actions";

export function TestimonialEditor({
  projectId,
  testimonialId,
  initial,
}: {
  projectId: string;
  testimonialId: string;
  initial: { name: string; company: string; role: string; message: string };
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateTestimonial(projectId, testimonialId, {
          name: values.name,
          company: values.company || null,
          role: values.role || null,
          message: values.message,
        });
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not save changes.");
      }
    });
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-xl border bg-card p-5">
      <h2 className="font-heading text-lg">Edit testimonial</h2>
      <label className="block space-y-1.5 text-sm font-medium">
        Name
        <Input required maxLength={200} value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 text-sm font-medium">
          Role
          <Input maxLength={200} value={values.role} onChange={(event) => setValues({ ...values, role: event.target.value })} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Company
          <Input maxLength={200} value={values.company} onChange={(event) => setValues({ ...values, company: event.target.value })} />
        </label>
      </div>
      <label className="block space-y-1.5 text-sm font-medium">
        Testimonial
        <Textarea required maxLength={5000} rows={7} value={values.message} onChange={(event) => setValues({ ...values, message: event.target.value })} />
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
    </form>
  );
}
