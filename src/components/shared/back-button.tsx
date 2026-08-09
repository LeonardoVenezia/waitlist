"use client";

import { useRouter } from "next/navigation";

export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    >
      ← Back
    </button>
  );
}
