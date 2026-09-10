"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createForm } from "@/lib/testimonials/actions";

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function NewForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const nameVal = (fd.get("name") as string).trim();

    try {
      const form = await createForm(projectId, {
        name: nameVal,
        slug: generateSlug(nameVal),
        description: (fd.get("description") as string) || undefined,
      });
      router.push(`/dashboard/projects/${projectId}/testimonials/forms/${form.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create form");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="text-sm font-medium">Name *</label>
        <input
          name="name"
          required
          autoFocus
          placeholder="e.g. Product feedback"
          className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <input
          name="description"
          placeholder="Shown at the top of your form"
          className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3 pt-4 border-t">
        <Button type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create form"}
        </Button>
        <button
          type="button"
          onClick={() => router.push(`/dashboard/projects/${projectId}/testimonials/forms`)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
