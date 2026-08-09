"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { createTestimonial } from "@/lib/testimonials/actions";

interface FormOption {
  id: string;
  name: string;
}

export function NewTestimonialForm({
  projectId,
  forms,
}: {
  projectId: string;
  forms: FormOption[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(5);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);

    try {
      await createTestimonial(projectId, {
        name: fd.get("name") as string,
        email: (fd.get("email") as string) || undefined,
        company: (fd.get("company") as string) || undefined,
        role: (fd.get("role") as string) || undefined,
        message: fd.get("message") as string,
        rating,
        form_id: (fd.get("form_id") as string) || undefined,
      });
      router.push(`/dashboard/projects/${projectId}/testimonials`);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-medium">Name *</label>
        <input
          name="name"
          required
          className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Company</label>
          <input
            name="company"
            className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Role</label>
          <input
            name="role"
            className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Rating</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label className="text-sm font-medium">Message *</label>
        <textarea
          name="message"
          required
          rows={4}
          className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary resize-y"
        />
      </div>

      {forms.length > 0 && (
        <div>
          <label className="text-sm font-medium">Form</label>
          <select
            name="form_id"
            className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="">None</option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save testimonial"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/dashboard/projects/${projectId}/testimonials`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
