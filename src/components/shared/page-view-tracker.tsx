"use client";

import { useEffect } from "react";

export function PageViewTracker({ waitlistId }: { waitlistId: string }) {
  useEffect(() => {
    fetch("/api/public/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waitlist_id: waitlistId, type: "view" }),
    }).catch(() => {});
  }, [waitlistId]);

  return null;
}
