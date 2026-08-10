"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createForm } from "@/lib/testimonials/actions";

export function NewForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState("");
  const [fields, setFields] = useState<string[]>(["name", "email", "message", "rating"]);

  const availableFields = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "company", label: "Company" },
    { key: "role", label: "Role" },
    { key: "message", label: "Message" },
    { key: "rating", label: "Rating" },
  ];

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function toggleField(key: string) {
    setFields((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const nameVal = fd.get("name") as string;
    const finalSlug = slug || generateSlug(nameVal);

    try {
      await createForm(projectId, {
        name: nameVal,
        slug: finalSlug,
        description: (fd.get("description") as string) || undefined,
        fields,
      });
      router.push(`/dashboard/projects/${projectId}/testimonials/forms`);
    } catch (e) {
      console.error(e);
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
          onChange={(e) => setSlug(generateSlug(e.target.value))}
          className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Slug *</label>
        <div className="flex items-center mt-1.5">
          <span className="text-xs text-muted-foreground mr-1">/t/</span>
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <input
          name="description"
          className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-3 block">Fields to include</label>
        <div className="flex flex-wrap gap-2">
          {availableFields.map((f) => {
            const active = fields.includes(f.key);
            return (
              <label
                key={f.key}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors select-none ${
                  active
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "hover:bg-accent"
                }`}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleField(f.key)}
                  className="sr-only"
                />
                {f.label}
              </label>
            );
          })}
        </div>
      </div>

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

