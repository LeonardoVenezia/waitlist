"use client";

import { useState } from "react";
import { IconForm } from "@/components/ui/icon";

export function CopyLinkPill({ url, compact = false }: { url: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy form link"
      className={`flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ${
        compact ? "max-w-[220px]" : "max-w-xs"
      }`}
    >
      <IconForm className="size-3.5 shrink-0" />
      <span className="truncate">{url}</span>
      <span className="shrink-0 text-primary font-medium">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
