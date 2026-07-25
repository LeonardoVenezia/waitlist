"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const isActive = pathname.startsWith("/dashboard");

  return (
    <aside className="flex w-16 flex-col border-r bg-muted/30">
      <nav className="flex flex-col items-center gap-2 p-3">
        <Link
          href="/dashboard"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
          title="Waitlist"
        >
          🎯
        </Link>
      </nav>
      <div className="flex-1" />
    </aside>
  );
}
