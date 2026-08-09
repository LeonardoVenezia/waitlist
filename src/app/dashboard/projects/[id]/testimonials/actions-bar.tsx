"use client";

import {
  approveTestimonial,
  rejectTestimonial,
  featureTestimonial,
  deleteTestimonial,
} from "@/lib/testimonials/actions";
import Link from "next/link";
import { useTransition } from "react";

export function TestimonialActions({
  id,
  projectId,
  status,
  isFeatured,
}: {
  id: string;
  projectId: string;
  status: string;
  isFeatured: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<void>) {
    startTransition(() => fn());
  }

  return (
    <div className="flex items-center gap-1 bg-background border rounded-lg shadow-sm p-1">
      {status === "pending" && (
        <button
          onClick={() => run(() => approveTestimonial(id))}
          disabled={pending}
          className="px-2 py-1 text-xs rounded hover:bg-green-50 text-green-600"
        >
          Approve
        </button>
      )}
      {status === "approved" && (
        <button
          onClick={() => run(() => rejectTestimonial(id))}
          disabled={pending}
          className="px-2 py-1 text-xs rounded hover:bg-red-50 text-red-600"
        >
          Reject
        </button>
      )}
      {status === "rejected" && (
        <button
          onClick={() => run(() => approveTestimonial(id))}
          disabled={pending}
          className="px-2 py-1 text-xs rounded hover:bg-green-50 text-green-600"
        >
          Approve
        </button>
      )}
      <button
        onClick={() => run(() => featureTestimonial(id, !isFeatured))}
        disabled={pending}
        className="px-2 py-1 text-xs rounded hover:bg-yellow-50 text-yellow-600"
      >
        {isFeatured ? "Unfeature" : "Feature"}
      </button>
      <button
        onClick={() => {
          if (confirm("Delete this testimonial?")) {
            run(() => deleteTestimonial(id));
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
