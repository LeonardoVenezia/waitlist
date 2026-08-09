"use client";

import { useTransition } from "react";
import { toggleFormStatus, deleteForm } from "@/lib/testimonials/actions";

export function FormRowActions({
  id,
  projectId,
  status,
}: {
  id: string;
  projectId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<void>) {
    startTransition(() => fn());
  }

  return (
    <div className="flex items-center gap-1 bg-background border rounded-lg shadow-sm p-1">
      {status === "draft" && (
        <button
          onClick={() => run(() => toggleFormStatus(id, "published"))}
          disabled={pending}
          className="px-2 py-1 text-xs rounded hover:bg-green-50 text-green-600"
        >
          Publish
        </button>
      )}
      {status === "published" && (
        <button
          onClick={() => run(() => toggleFormStatus(id, "draft"))}
          disabled={pending}
          className="px-2 py-1 text-xs rounded hover:bg-yellow-50 text-yellow-600"
        >
          Unpublish
        </button>
      )}
      <button
        onClick={() => {
          if (confirm("Delete this form?")) {
            run(() => deleteForm(id));
          }
        }}
        disabled={pending}
        className="px-2 py-1 text-xs rounded hover:bg-red-50 text-red-600"
      >
        Delete
      </button>
    </div>
  );
}
