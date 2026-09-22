"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { updateForm } from "@/lib/testimonials/actions";

export type FormQuestion = {
  label: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  required: boolean;
};

export function QuestionsEditor({
  formId,
  questions,
  savedQuestions,
  onChange,
  onSaved,
}: {
  formId: string;
  questions: FormQuestion[];
  savedQuestions: FormQuestion[];
  onChange: (next: FormQuestion[]) => void;
  onSaved: (clean: FormQuestion[]) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = JSON.stringify(questions) !== JSON.stringify(savedQuestions);

  function update(index: number, patch: Partial<FormQuestion>) {
    onChange(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  async function handleSave() {
    const clean = questions
      .map((q) => ({
        ...q,
        label: q.label.trim(),
        options:
          q.type === "select"
            ? (q.options ?? []).map((o) => o.trim()).filter(Boolean)
            : undefined,
      }))
      .filter((q) => q.label);

    setSaving(true);
    setError(null);
    try {
      await updateForm(formId, { questions: clean });
      onSaved(clean);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-semibold text-base mb-1">Questions</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Custom questions shown below the main fields. Answers appear on each testimonial.
      </p>

      {questions.length === 0 && (
        <p className="text-sm text-muted-foreground mb-3">No custom questions yet.</p>
      )}

      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={i} className="rounded-lg border bg-background p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <input
                value={q.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Question label"
                className="flex-1 rounded-md border bg-transparent px-2.5 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <Select
                value={q.type}
                onChange={(e) => update(i, { type: e.target.value as FormQuestion["type"] })}
                className="w-28 shrink-0"
              >
                <option value="text">Short text</option>
                <option value="textarea">Paragraph</option>
                <option value="select">Choice</option>
              </Select>
              <button
                type="button"
                onClick={() => onChange(questions.filter((_, j) => j !== i))}
                className="text-xs text-muted-foreground hover:text-red-600 shrink-0"
              >
                Remove
              </button>
            </div>

            {q.type === "select" && (
              <input
                value={(q.options ?? []).join(", ")}
                onChange={(e) =>
                  update(i, { options: e.target.value.split(",").map((o) => o.trim()) })
                }
                placeholder="Options, comma separated"
                className="w-full rounded-md border bg-transparent px-2.5 py-1.5 text-xs focus:border-primary focus:ring-1 focus:ring-primary"
              />
            )}

            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={q.required}
                onChange={(e) => update(i, { required: e.target.checked })}
                className="accent-[var(--primary)]"
              />
              Required
            </label>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-3">
        <button
          type="button"
          onClick={() => onChange([...questions, { label: "", type: "text", required: false }])}
          className="text-sm text-primary hover:underline"
        >
          + Add question
        </button>
        {dirty && (
          <>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save questions"}
            </Button>
            <button
              type="button"
              onClick={() => onChange(savedQuestions)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Discard
            </button>
          </>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
