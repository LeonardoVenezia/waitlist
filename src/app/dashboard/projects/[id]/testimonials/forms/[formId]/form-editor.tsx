"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StarRating } from "@/components/ui/star-rating";
import { toggleFormStatus, deleteForm, updateForm } from "@/lib/testimonials/actions";
import type { Database } from "@/lib/supabase/types";

type FormRow = Database["public"]["Tables"]["testimonial_forms"]["Row"];

const AVAILABLE_FIELDS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "company", label: "Company" },
  { key: "role", label: "Role" },
  { key: "message", label: "Message" },
  { key: "rating", label: "Rating" },
];

export function FormEditor({ form, projectId }: { form: FormRow; projectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(form.status);
  const fields: string[] = Array.isArray(form.fields) ? form.fields as string[] : [];

  function handleStatus(next: "draft" | "published" | "archived") {
    startTransition(async () => {
      await toggleFormStatus(form.id, next);
      setStatus(next);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this form? All associated submissions will be kept.")) return;
    startTransition(async () => {
      await deleteForm(form.id);
      router.push(`/dashboard/projects/${projectId}/testimonials/forms`);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Config */}
      <div className="space-y-5">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-medium text-sm mb-4">Status</h3>
          <div className="flex gap-2">
            <Button
              variant={status === "draft" ? "default" : "outline"}
              onClick={() => handleStatus("draft")}
              size="sm"
            >
              Draft
            </Button>
            <Button
              variant={status === "published" ? "default" : "outline"}
              onClick={() => handleStatus("published")}
              size="sm"
            >
              Published
            </Button>
            <Button
              variant={status === "archived" ? "default" : "outline"}
              onClick={() => handleStatus("archived")}
              size="sm"
            >
              Archived
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-medium text-sm mb-4">Moderation</h3>
          <Select
            value={form.moderation}
            onChange={(e) => {
              const next = e.target.value as "manual" | "auto";
              startTransition(async () => {
                await updateForm(form.id, { moderation: next });
              });
            }}
            disabled={pending}
          >
            <option value="manual">Approve each testimonial manually</option>
            <option value="auto">Publish automatically</option>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            {form.moderation === "auto"
              ? "New submissions appear on your public page immediately."
              : "New submissions wait for your approval in the dashboard."}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-medium text-sm mb-3">Active fields</h3>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_FIELDS.map((f) => {
              const active = fields.includes(f.key);
              return (
                <span
                  key={f.key}
                  className={`px-2.5 py-1 rounded-md text-xs border ${
                    active ? "bg-primary/5 border-primary text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {f.label}
                </span>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          className="text-sm text-red-600 hover:underline"
        >
          Delete form
        </button>
      </div>

      {/* Preview */}
      <div>
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Preview</p>
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-heading text-lg font-semibold text-center mb-1">{form.name}</h3>
          {form.description && (
            <p className="text-sm text-muted-foreground text-center mb-5">{form.description}</p>
          )}
          <div className="space-y-4">
            {fields.includes("name") && (
              <div>
                <label className="text-sm font-medium">Name *</label>
                <div className="mt-1.5 h-9 rounded-md border bg-muted/50" />
              </div>
            )}
            {fields.includes("email") && (
              <div>
                <label className="text-sm font-medium">Email</label>
                <div className="mt-1.5 h-9 rounded-md border bg-muted/50" />
              </div>
            )}
            {fields.includes("company") && (
              <div>
                <label className="text-sm font-medium">Company</label>
                <div className="mt-1.5 h-9 rounded-md border bg-muted/50" />
              </div>
            )}
            {fields.includes("role") && (
              <div>
                <label className="text-sm font-medium">Role</label>
                <div className="mt-1.5 h-9 rounded-md border bg-muted/50" />
              </div>
            )}
            {fields.includes("rating") && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Rating</label>
                <StarRating value={5} readonly size="lg" />
              </div>
            )}
            {fields.includes("message") && (
              <div>
                <label className="text-sm font-medium">Message *</label>
                <div className="mt-1.5 h-24 rounded-md border bg-muted/50" />
              </div>
            )}
            <Button className="w-full" disabled>
              Submit testimonial
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
